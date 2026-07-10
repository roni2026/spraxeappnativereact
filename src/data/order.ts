import { supabase } from '../lib/supabase';
import { getCurrentUserId } from './auth';
import { clearCart } from './cart';
import { CartItemRow, OrderItemRow, OrderRow } from '../types/models';
import { displayPrice } from '../types/models';

export const SHIPPING_INSIDE_DHAKA = 60;
export const SHIPPING_OUTSIDE_DHAKA = 120;

export const PAYMENT_METHODS = ['Cash on Delivery', 'bKash', 'Nagad'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export async function getMyOrders(): Promise<OrderRow[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

export async function getOrderDetail(
  orderId: string,
): Promise<{ order: OrderRow; items: OrderItemRow[] }> {
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (orderErr) throw orderErr;

  const { data: items, error: itemsErr } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  if (itemsErr) throw itemsErr;

  return { order: order as OrderRow, items: (items ?? []) as OrderItemRow[] };
}

export interface PlaceOrderArgs {
  items: CartItemRow[];
  deliveryInsideDhaka: boolean;
  contactPhone: string;
  shippingAddress: string;
  paymentMethod?: PaymentMethod;
  paymentTransactionId?: string | null;
}

export async function placeOrder(args: PlaceOrderArgs): Promise<OrderRow> {
  const {
    items,
    deliveryInsideDhaka,
    contactPhone,
    shippingAddress,
    paymentMethod = 'Cash on Delivery',
    paymentTransactionId,
  } = args;

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Must be signed in to place an order');

  const subtotal = items.reduce(
    (sum, it) => sum + (it.product ? displayPrice(it.product) : 0) * it.quantity,
    0,
  );
  const shippingCost = deliveryInsideDhaka ? SHIPPING_INSIDE_DHAKA : SHIPPING_OUTSIDE_DHAKA;
  const total = subtotal + shippingCost;
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

  const orderPayload: Record<string, unknown> = {
    user_id: userId,
    order_number: orderNumber,
    total,
    subtotal,
    discount: 0,
    status: 'pending',
    payment_status: 'pending',
    payment_method: paymentMethod,
    shipping_address: shippingAddress,
    delivery_location: deliveryInsideDhaka ? 'inside' : 'outside',
    shipping_cost: shippingCost,
    contact_number: contactPhone,
  };
  if (paymentTransactionId && paymentTransactionId.trim().length > 0) {
    orderPayload.payment_transaction_id = paymentTransactionId;
  }

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select()
    .single();
  if (orderErr) throw orderErr;

  const orderRow = order as OrderRow;

  const orderItems = items.map((it) => {
    const price = it.product ? displayPrice(it.product) : 0;
    return {
      order_id: orderRow.id,
      product_id: it.product_id,
      product_name: it.product?.name ?? '',
      product_sku: it.product_id,
      quantity: it.quantity,
      unit_price: price,
      total_price: price * it.quantity,
    };
  });

  if (orderItems.length > 0) {
    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;
  }

  await clearCart();
  return orderRow;
}
