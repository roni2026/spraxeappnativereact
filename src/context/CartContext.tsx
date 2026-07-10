import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import * as CartApi from '../data/cart';
import { CartItemRow } from '../types/models';

interface CartContextValue {
  items: CartItemRow[];
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [items, setItems] = useState<CartItemRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await CartApi.getCartItems();
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      await CartApi.addToCart(productId, quantity);
      await refresh();
    },
    [refresh],
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      await CartApi.updateQuantity(cartItemId, quantity);
      await refresh();
    },
    [refresh],
  );

  const removeItem = useCallback(
    async (cartItemId: string) => {
      await CartApi.removeItem(cartItemId);
      await refresh();
    },
    [refresh],
  );

  const clearCart = useCallback(async () => {
    await CartApi.clearCart();
    await refresh();
  }, [refresh]);

  const count = useMemo(() => items.reduce((s, it) => s + it.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({ items, count, loading, refresh, addToCart, updateQuantity, removeItem, clearCart }),
    [items, count, loading, refresh, addToCart, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
