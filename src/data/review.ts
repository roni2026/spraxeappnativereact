import { supabase } from '../lib/supabase';
import { getCurrentUserId } from './auth';
import { ProductReviewRow } from '../types/models';

export interface ReviewSummary {
  average: number;
  count: number;
}

export async function getReviews(productId: string): Promise<ProductReviewRow[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProductReviewRow[];
}

export function summarize(reviews: ProductReviewRow[]): ReviewSummary {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { average: avg, count: reviews.length };
}

export async function myReview(
  reviews: ProductReviewRow[],
): Promise<ProductReviewRow | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return reviews.find((r) => r.user_id === userId) ?? null;
}

/** A customer may review only a product delivered to them. */
export async function hasDeliveredPurchase(productId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  const { data, error } = await supabase
    .from('order_items')
    .select('product_id, orders(user_id, status)')
    .eq('product_id', productId);
  if (error) throw error;
  return (data ?? []).some((row: any) => {
    const ord = Array.isArray(row.orders) ? row.orders[0] : row.orders;
    return ord?.status === 'delivered';
  });
}

export async function submitReview(
  productId: string,
  rating: number,
  comment: string | null,
  verifiedPurchase: boolean,
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Must be signed in to leave a review');
  const { error } = await supabase.from('product_reviews').upsert(
    {
      product_id: productId,
      user_id: userId,
      rating,
      comment: comment && comment.trim().length > 0 ? comment : null,
      verified_purchase: verifiedPurchase,
    },
    { onConflict: 'product_id,user_id' },
  );
  if (error) throw error;
}

export async function deleteMyReview(productId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const { error } = await supabase
    .from('product_reviews')
    .delete()
    .eq('product_id', productId)
    .eq('user_id', userId);
  if (error) throw error;
}
