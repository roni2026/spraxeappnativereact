import { supabase } from '../lib/supabase';
import { Category, FeatureCard, FeaturedImage, Product } from '../types/models';

/**
 * Returns true when a Supabase/PostgREST error means the table or column the
 * query referenced does not exist in the database (schema mismatch), e.g.
 * "Could not find the table 'public.feature_cards' in the schema cache".
 *
 * When the backend schema is missing something the app expects, we degrade
 * gracefully (return an empty list) instead of throwing — a missing optional
 * table should never blank out the whole Home screen or crash a category page.
 */
function isMissingSchema(error: any): boolean {
  if (!error) return false;
  const code = String(error.code ?? '');
  const msg = String(error.message ?? '').toLowerCase();
  return (
    code === 'PGRST205' || // table not found in schema cache
    code === 'PGRST204' || // column not found in schema cache
    code === '42P01' || //    undefined_table
    code === '42703' || //    undefined_column
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find')
  );
}

/**
 * Run a Supabase query and return `fallback` when the table/column is missing.
 * Other errors (network, auth, etc.) are re-thrown so real problems still
 * surface in the UI. `label` is used only for a dev-console warning.
 */
async function safe<T>(
  label: string,
  run: () => Promise<{ data: T | null; error: any }>,
  fallback: T,
): Promise<T> {
  try {
    const { data, error } = await run();
    if (error) {
      if (isMissingSchema(error)) {
        // eslint-disable-next-line no-console
        console.warn(`[catalog] ${label}: backend schema missing — returning fallback. (${error.message})`);
        return fallback;
      }
      throw error;
    }
    return (data ?? fallback) as T;
  } catch (e) {
    if (isMissingSchema(e)) {
      // eslint-disable-next-line no-console
      console.warn(`[catalog] ${label}: backend schema missing — returning fallback.`);
      return fallback;
    }
    throw e;
  }
}

export async function getFeaturedImages(): Promise<FeaturedImage[]> {
  return safe(
    'getFeaturedImages',
    () =>
      supabase
        .from('featured_images')
        .select('id, title, description, image_url, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    [] as FeaturedImage[],
  );
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
        .select('id, name, image_url, sort_order')
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
        .select('id, name, slug, price, base_price, images')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(20),
    [] as Product[],
  );
}

export async function getBestSellers(): Promise<Product[]> {
  return safe(
    'getBestSellers',
    () =>
      supabase
        .from('products')
        .select('id, name, slug, price, base_price, images, total_sales')
        .eq('is_active', true)
        .order('total_sales', { ascending: false })
        .limit(20),
    [] as Product[],
  );
}

export async function searchProducts(
  query?: string | null,
  categoryId?: string | null,
  page = 0,
  pageSize = 20,
): Promise<Product[]> {
  return safe(
    'searchProducts',
    () => {
      let q = supabase
        .from('products')
        .select('id, name, slug, price, base_price, images, category_id')
        .eq('is_active', true);
      if (query && query.trim().length > 0) {
        q = q.ilike('name', `%${query}%`);
      }
      if (categoryId && categoryId.trim().length > 0) {
        q = q.eq('category_id', categoryId);
      }
      return q.range(page * pageSize, (page + 1) * pageSize - 1);
    },
    [] as Product[],
  );
}

/** Look up a product by slug, falling back to matching by id. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return safe(
    'getProductBySlug',
    () =>
      supabase
        .from('products')
        .select(
          'id, name, slug, description, price, base_price, images, category_id, is_active, is_featured, stock_quantity, total_sales',
        )
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle(),
    null as Product | null,
  );
}
