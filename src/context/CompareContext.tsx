import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, displayPrice, thumbnail } from '../types/models';

const KEY = 'spraxe_compare_v1';
const MAX = 4;

export type CompareItem = {
  id: string;
  slug?: string | null;
  name: string;
  image?: string;
  price: number | null;
  retail_price?: number | null;
  stock_quantity?: number | null;
};

type Ctx = {
  items: CompareItem[];
  maxItems: number;
  isInCompare: (id: string) => boolean;
  toggle: (p: Product | CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CompareContext = createContext<Ctx | null>(null);

function toItem(p: Product | CompareItem): CompareItem {
  if ('price' in p && typeof (p as any).images === 'undefined' && 'image' in p) {
    return p as CompareItem;
  }
  const prod = p as Product;
  return {
    id: prod.id,
    slug: prod.slug,
    name: prod.name,
    image: thumbnail(prod),
    price: displayPrice(prod),
    retail_price: prod.retail_price ?? null,
    stock_quantity: prod.stock_quantity ?? null,
  };
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.slice(0, MAX));
      } catch {}
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const isInCompare = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((p: Product | CompareItem) => {
    const item = toItem(p);
    setItems((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev.filter((x) => x.id !== item.id);
      if (prev.length >= MAX) return prev; // caller should toast
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((x) => x.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, maxItems: MAX, isInCompare, toggle, remove, clear }),
    [items, isInCompare, toggle, remove, clear],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare requires CompareProvider');
  return ctx;
}
