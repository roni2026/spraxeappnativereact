// Types mirror the Supabase Postgrest tables (snake_case columns).

export interface Product {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  price?: number | null;
  base_price?: number | null;
  images?: string[] | null;
  category_id?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  stock_quantity?: number | null;
  total_sales?: number | null;
}

export function displayPrice(p: Product): number {
  return p.price ?? p.base_price ?? 0;
}

export function thumbnail(p: Product): string | undefined {
  return p.images && p.images.length > 0 ? p.images[0] : undefined;
}

export interface Category {
  id: string;
  name: string;
  image_url?: string | null;
  parent_id?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
}

export interface FeaturedImage {
  id: number;
  title?: string | null;
  description?: string | null;
  image_url: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface FeatureCard {
  id: number;
  title: string;
  description: string;
  icon?: string;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  role?: string | null;
  fcm_token?: string | null;
}

export interface CartItemRow {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: Product | null;
}

export interface OrderRow {
  id: string;
  order_number?: string | null;
  user_id?: string | null;
  total: number;
  subtotal?: number | null;
  discount?: number | null;
  status: string;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_transaction_id?: string | null;
  shipping_address?: string | null;
  delivery_location?: string | null;
  shipping_cost?: number | null;
  contact_number?: string | null;
  created_at?: string | null;
}

export interface OrderItemRow {
  id?: string | null;
  order_id?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  product_sku?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface WishlistItemRow {
  id: string;
  user_id?: string | null;
  product_id: string;
  product?: Product | null;
}

export interface ProductReviewRow {
  id: string;
  product_id: string;
  user_id?: string | null;
  rating: number;
  comment?: string | null;
  verified_purchase?: boolean;
  created_at?: string | null;
}
