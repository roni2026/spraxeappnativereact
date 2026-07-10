import { supabase } from '../lib/supabase';
import { getCurrentUserId } from './auth';
import { WishlistItemRow } from '../types/models';

async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new Error('Must be signed in to use the wishlist');
  return id;
}

export async function getWishlist(): Promise<WishlistItemRow[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*, product:products(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as WishlistItemRow[];
}

export async function getWishlistedIds(): Promise<Set<string>> {
  const userId = await getCurrentUserId();
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('product_id')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r: { product_id: string }) => r.product_id));
}

export async function isWishlisted(productId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId);
  if (error) throw error;
  return (data ?? []).length > 0;
}

/** Toggle wishlist membership; returns the new state (true = now wishlisted). */
export async function toggleWishlist(productId: string): Promise<boolean> {
  const userId = await requireUserId();
  const already = await isWishlisted(productId);
  if (already) {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from('wishlist_items')
    .insert({ user_id: userId, product_id: productId });
  if (error) throw error;
  return true;
}

export async function removeFromWishlist(productId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  if (error) throw error;
}
