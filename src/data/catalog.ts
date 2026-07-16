import { supabase } from '../lib/supabase';
import { Category, FeatureCard, FeaturedImage, Product } from '../types/models';

/**
 * Returns true when a Supabase/PostgREST error means the table or column the
 * query referenced does not exist in the database (schema mismatch).
 */
function isMissingSchema(error: any): boolean {
  if (!error) return false;
  const code = String(error.code ?? '');
  const msg = String(error.message ?? '').toLowerCase();
  return (
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    code === '42P01' ||
    code === '42703' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find')
  );
}

async function safe<T>(
  label: string,
  run: () => Promise<{ data: T | null; error: any }>,
  fallback: T,
): Promise<T> {
  try {
    const { data, error } = await run();
    if (error) {
      if (isMissingSchema(error)) {
        console.warn(`[catalog] ${label}: backend schema missing — returning fallback. (${error.message})`);
        return fallback;
      }
      throw error;
    }
    return (data ?? fallback) as T;
  } catch (e) {
    if (isMissingSchema(e)) {
      console.warn(`[catalog] ${label}: backend schema missing — returning fallback.`);
      return fallback;
    }
    throw e;
  }
}

// Product select fields matching the website schema
const PRODUCT_FIELDS = 'id, name, slug, price, base_price, retail_price, images, category_id, is_active, is_featured, stock_quantity, total_sales, color_group_id, color_name, color_hex, created_at';

export async function getFeaturedImages(): Promise<FeaturedImage[]> {
  return safe(
    'getFeaturedImages',
    () =>
      supabase
        .from('featured_images')
        .select('id, title, description, image_url, mobile_image_url, link_url, placement, storage_path, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    [] as FeaturedImage[],
  );
}

/** Get hero featured images (placement = 'hero' or null) */
export async function getHeroImages(): Promise<FeaturedImage[]> {
  const all = await getFeaturedImages();
  return all.filter((img) => !img.placement || img.placement === 'hero');
}

/** Get info carousel images (placement = 'info_carousel') */
export async function getInfoCarouselImages(): Promise<FeaturedImage[]> {
  const all = await getFeaturedImages();
  return all.filter((img) => img.placement === 'info_carousel');
}

export async function getFeatureCards(): Promise<FeatureCard[]> {
  return safe(
    'getFeatureCards',
    () =>
      supabase
        .from('feature_cards')
        .select('id, title, description, icon, image_url, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(6),
    [] as FeatureCard[],
  );
}

export async function getCategories(): Promise<Category[]> {
  return safe(
    'getCategories',
    () =>
      supabase
        .from('categories')
        .select('id, name, slug, image_url, parent_id, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    [] as Category[],
  );
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return safe(
    'getFeaturedProducts',
    () =>
      supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('is_active', true)
        .eq('is_featured', true)
        .is('color_name', null)
        .limit(6),
    [] as Product[],
  );
}

export async function getBestSellers(): Promise<Product[]> {
  return safe(
    'getBestSellers',
    () =>
      supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('is_active', true)
        .is('color_name', null)
        .order('total_sales', { ascending: false })
        .limit(6),
    [] as Product[],
  );
}

export async function getNewArrivals(): Promise<Product[]> {
  return safe(
    'getNewArrivals',
    () =>
      supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('is_active', true)
        .is('color_name', null)
        .order('created_at', { ascending: false })
        .limit(8),
    [] as Product[],
  );
}

export async function searchProducts(
  query?: string | null,
  categoryId?: string | null,
  page = 0,
  pageSize = 20,
  sort?: string | null,
): Promise<Product[]> {
  return safe(
    'searchProducts',
    () => {
      let q = supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('is_active', true)
        .is('color_name', null);
      if (query && query.trim().length > 0) {
        q = q.ilike('name', `%${query}%`);
      }
      if (categoryId && categoryId.trim().length > 0) {
        q = q.eq('category_id', categoryId);
      }
      // Apply server-side sorting
      switch (sort) {
        case 'price-asc':
          q = q.order('price', { ascending: true });
          break;
        case 'price-desc':
          q = q.order('price', { ascending: false });
          break;
        case 'name-asc':
          q = q.order('name', { ascending: true });
          break;
        case 'name-desc':
          q = q.order('name', { ascending: false });
          break;
        case 'best-selling':
          q = q.order('total_sales', { ascending: false });
          break;
        case 'newest':
        default:
          q = q.order('created_at', { ascending: false });
          break;
      }
      return q.range(page * pageSize, (page + 1) * pageSize - 1);
    },
    [] as Product[],
  );
}

/** Look up a product by slug, falling back to matching by id only if the slug is a valid UUID. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Check if the provided string looks like a UUID
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = UUID_RE.test(slug);

  return safe(
    'getProductBySlug',
    () => {
      if (isUuid) {
        // If it's a UUID, try both slug and id match
        return supabase
          .from('products')
          .select(
            'id, name, slug, description, price, base_price, retail_price, images, category_id, is_active, is_featured, stock_quantity, total_sales, color_group_id, color_name, color_hex, created_at',
          )
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .maybeSingle();
      }
      // For non-UUID slugs (like "xiaomi-tv-box-s-2nd-gen..."), only match by slug
      return supabase
        .from('products')
        .select(
          'id, name, slug, description, price, base_price, retail_price, images, category_id, is_active, is_featured, stock_quantity, total_sales, color_group_id, color_name, color_hex, created_at',
        )
        .eq('slug', slug)
        .maybeSingle();
    },
    null as Product | null,
  );
}

/** Get products by category slug */
export async function getProductsByCategorySlug(categorySlug: string, page = 0, pageSize = 20): Promise<Product[]> {
  // First get the category id from slug
  const { data: cat, error: catErr } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle();

  if (catErr || !cat) return [];

  return searchProducts(null, cat.id, page, pageSize);
}


/** Top-level categories only (no parent). */
export async function getRootCategories(): Promise<Category[]> {
  const all = await getCategories();
  const roots = all.filter((c) => !c.parent_id);
  return roots.length ? roots : all;
}

/** Children of a category. */
export async function getSubcategories(parentId: string): Promise<Category[]> {
  const all = await getCategories();
  return all.filter((c) => c.parent_id === parentId);
}

/** Nested tree for UI. */
export async function getCategoryTree(): Promise<Array<Category & { children: Category[] }>> {
  const all = await getCategories();
  const byParent = new Map<string | null, Category[]>();
  for (const c of all) {
    const key = c.parent_id ?? null;
    const list = byParent.get(key) ?? [];
    list.push(c);
    byParent.set(key, list);
  }
  const roots = byParent.get(null) ?? all.filter((c) => !c.parent_id);
  return roots.map((r) => ({
    ...r,
    children: (byParent.get(r.id) ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  }));
}

export async function trackOrderByNumber(orderNumber: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total, created_at, shipping_address, payment_method, contact_phone')
    .eq('order_number', orderNumber.trim())
    .maybeSingle();
  if (error) {
    // fallback: search by id prefix
    const { data: d2 } = await supabase.from('orders').select('*').ilike('id', `${orderNumber}%`).limit(1).maybeSingle();
    return d2 ?? null;
  }
  return data;
}
