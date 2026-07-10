import { supabase } from '../lib/supabase';
import { getCurrentUserId } from './auth';
import { CartItemRow } from '../types/models';

async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new Error('Must be signed in to use the cart');
  return id;
}

export async function getCartItems(): Promise<CartItemRow[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, product:products(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as CartItemRow[];
}

export async function addToCart(productId: string, quantity = 1): Promise<void> {
  const userId = await requireUserId();
  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    const row = existing as CartItemRow;
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: row.quantity + quantity })
      .eq('id', row.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, product_id: productId, quantity });
    if (error) throw error;
  }
}

export async function updateQuantity(cartItemId: string, quantity: number): Promise<void> {
  if (quantity <= 0) {
    await removeItem(cartItemId);
    return;
  }
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId);
  if (error) throw error;
}

export async function removeItem(cartItemId: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
  if (error) throw error;
}

export async function clearCart(): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
  if (error) throw error;
}
