import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getCategories, searchProducts } from '../../data/catalog';
import { Category, Product } from '../../types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'Products'>;

const PAGE_SIZE = 20;

export default function ProductsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { addToCart } = useCart();
  const { userId } = useAuth();

  const [query, setQuery] = useState(route.params?.initialQuery ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    route.params?.categoryId ?? null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(0);
    pageRef.current = 0;
    setHasMore(true);
    try {
      const result = await searchProducts(query, selectedCategory, 0, PAGE_SIZE);
      setProducts(result);
      setHasMore(result.length === PAGE_SIZE);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory]);

  // debounced search on query/category change
  useEffect(() => {
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
  }, [runSearch]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const result = await searchProducts(query, selectedCategory, nextPage, PAGE_SIZE);
      if (result.length > 0) {
        setProducts((prev) => [...prev, ...result]);
        setPage(nextPage);
        pageRef.current = nextPage;
        setHasMore(result.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch {
      /* ignore pagination errors */
    } finally {
      setLoadingMore(false);
    }
  }, [query, selectedCategory, loadingMore, hasMore, loading]);

  const handleAdd = async (p: Product) => {
    if (!userId) {
      navigation.navigate('Login');
      return;
    }
    try {
      await addToCart(p.id);
    } catch {
      /* ignore */
    }
  };

  const openProduct = (p: Product) =>
    navigation.navigate('ProductDetail', { slug: p.slug ?? p.id, name: p.name });

  return (
    <View style={styles.flex}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.gray600} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products"
          placeholderTextColor={colors.gray600}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.gray600} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedCategory && styles.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((c) => {
          const active = selectedCategory === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedCategory(active ? null : c.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.navy900} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={runSearch}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={48} color={colors.gray600} />
          <Text style={styles.empty}>No products found</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={10}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.navy900} size="small" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <ProductCard product={item} onPress={openProduct} onAddToCart={handleAdd} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    margin: 16,
    marginBottom: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: colors.gray900 },
  filterScroll: { maxHeight: 44 },
  filterRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    height: 34,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.navy900 },
  chipText: { color: colors.gray600, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  error: { color: colors.destructive },
  retry: { color: colors.orange500, fontWeight: '700' },
  empty: { color: colors.textMuted },
  list: { padding: 16, paddingTop: 12 },
  row: { justifyContent: 'space-between' },
  cell: { width: '48%', marginBottom: 12 },
  footer: { paddingVertical: 16, alignItems: 'center' },
});
