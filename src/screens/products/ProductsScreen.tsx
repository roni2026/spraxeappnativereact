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
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'Products'>;

const PAGE_SIZE = 20;

type SortKey = 'newest' | 'best-selling' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

const SORT_OPTIONS: Array<{ value: SortKey; label: string; labelBn: string }> = [
  { value: 'newest', label: 'Newest', labelBn: 'নতুনতম' },
  { value: 'best-selling', label: 'Best Selling', labelBn: 'বেস্ট সেলিং' },
  { value: 'price-asc', label: 'Price: Low → High', labelBn: 'দাম: কম → বেশি' },
  { value: 'price-desc', label: 'Price: High → Low', labelBn: 'দাম: বেশি → কম' },
  { value: 'name-asc', label: 'Name: A → Z', labelBn: 'নাম: A → Z' },
  { value: 'name-desc', label: 'Name: Z → A', labelBn: 'নাম: Z → A' },
];

export default function ProductsScreen() {
  const { t, i18n } = useTranslation();
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
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const allProductsRef = useRef<Product[]>([]);

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
      const result = await searchProducts(query, selectedCategory, 0, PAGE_SIZE, sortBy);
      allProductsRef.current = result;
      setProducts(result);
      setHasMore(result.length === PAGE_SIZE);
    } catch (e: any) {
      setError(e?.message ?? t('common.failedToLoadProducts'));
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, sortBy]);

  // debounced search on query/category/sort change
  useEffect(() => {
    const timer = setTimeout(runSearch, 300);
    return () => clearTimeout(timer);
  }, [runSearch]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const result = await searchProducts(query, selectedCategory, nextPage, PAGE_SIZE, sortBy);
      if (result.length > 0) {
        allProductsRef.current = [...allProductsRef.current, ...result];
        setProducts(allProductsRef.current);
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
  }, [query, selectedCategory, loadingMore, hasMore, loading, sortBy]);

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

  const currentSortLabel = (() => {
    const opt = SORT_OPTIONS.find((s) => s.value === sortBy);
    if (!opt) return '';
    return i18n.language?.startsWith('bn') ? opt.labelBn : opt.label;
  })();

  return (
    <View style={styles.flex}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.gray600} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.searchProducts')}
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

      <View style={styles.filterContainer}>
        {/* Category filter scroll */}
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
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>{t('common.all')}</Text>
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

        {/* Sort button */}
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setSortMenuOpen((v) => !v)}
        >
          <Ionicons name="options-outline" size={16} color={colors.navy900} />
          <Text style={styles.sortBtnText} numberOfLines={1}>{currentSortLabel}</Text>
          <Ionicons name={sortMenuOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.gray600} />
        </TouchableOpacity>
      </View>

      {/* Sort dropdown */}
      {sortMenuOpen && (
        <View style={styles.sortDropdown}>
          <Text style={styles.sortDropdownTitle}>
            {i18n.language?.startsWith('bn') ? 'ক্রমানুসার' : 'Sort By'}
          </Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortOption, sortBy === opt.value && styles.sortOptionActive]}
              onPress={() => {
                setSortBy(opt.value);
                setSortMenuOpen(false);
              }}
            >
              <Text style={[styles.sortOptionText, sortBy === opt.value && styles.sortOptionTextActive]}>
                {i18n.language?.startsWith('bn') ? opt.labelBn : opt.label}
              </Text>
              {sortBy === opt.value && <Ionicons name="checkmark" size={16} color={colors.navy900} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.navy900} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={runSearch}>
            <Text style={styles.retry}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={48} color={colors.gray600} />
          <Text style={styles.empty}>{t('common.noProductsFound')}</Text>
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
  filterContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  filterScroll: { flex: 1, maxHeight: 44 },
  filterRow: { gap: 8, alignItems: 'center' },
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
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 34,
    marginLeft: 8,
  },
  sortBtnText: { fontSize: 12, fontWeight: '600', color: colors.navy900, maxWidth: 90 },
  sortDropdown: {
    position: 'absolute',
    top: 120,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
    width: 200,
  },
  sortDropdownTitle: { fontSize: 13, fontWeight: '700', color: colors.gray900, paddingVertical: 6, paddingHorizontal: 8 },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sortOptionActive: { backgroundColor: colors.gray100 },
  sortOptionText: { fontSize: 13, color: colors.gray600 },
  sortOptionTextActive: { fontSize: 13, color: colors.navy900, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  error: { color: colors.destructive },
  retry: { color: colors.orange500, fontWeight: '700' },
  empty: { color: colors.textMuted },
  list: { padding: 16, paddingTop: 12 },
  row: { justifyContent: 'space-between' },
  cell: { width: '48%', marginBottom: 12 },
  footer: { paddingVertical: 16, alignItems: 'center' },
});
