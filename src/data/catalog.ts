import { supabase } from '../lib/supabase';
import { Category, FeatureCard, FeaturedImage, Product } from '../types/models';

export async function getFeaturedImages(): Promise<FeaturedImage[]> {
  const { data, error } = await supabase
    .from('featured_images')
    .select('id, title, description, image_url, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as FeaturedImage[];
}

export async function getFeatureCards(): Promise<FeatureCard[]> {
  const { data, error } = await supabase
    .from('feature_cards')
    .select('id, title, description, icon, image_url, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(6);
  if (error) throw error;
  return (data ?? []) as FeatureCard[];
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, image_url, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price, base_price, images')
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getBestSellers(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price, base_price, images, total_sales')
    .eq('is_active', true)
    .order('total_sales', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function searchProducts(
  query?: string | null,
  categoryId?: string | null,
  page = 0,
  pageSize = 20,
): Promise<Product[]> {
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
  const { data, error } = await q.range(page * pageSize, (page + 1) * pageSize - 1);
  if (error) throw error;
  return (data ?? []) as Product[];
}

/** Look up a product by slug, falling back to matching by id. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, description, price, base_price, images, category_id, is_active, is_featured, stock_quantity, total_sales')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();
  if (error) throw error;
  return (data as Product) ?? null;
}
