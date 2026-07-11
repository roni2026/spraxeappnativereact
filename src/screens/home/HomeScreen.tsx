import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import FallbackImage from '../../components/FallbackImage';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  getBestSellers,
  getCategories,
  getFeatureCards,
  getFeaturedImages,
  getFeaturedProducts,
} from '../../data/catalog';
import { Category, FeatureCard, FeaturedImage, Product } from '../../types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const BANNER_W = width - 32;

// Module-level cache so re-focusing the Home tab doesn't re-fetch every time.
interface HomeCacheData {
  banners: FeaturedImage[];
  categories: Category[];
  bestSellers: Product[];
  featured: Product[];
  cards: FeatureCard[];
}
let homeCache: { data: HomeCacheData; timestamp: number } | null = null;
const CACHE_TTL = 30_000; // 30 seconds

// Ionicons fallback lookup for feature card icons coming from the backend.
const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Truck: 'car-outline',
  LocalShipping: 'car-outline',
  Shield: 'shield-checkmark-outline',
  Verified: 'checkmark-circle-outline',
  Sell: 'pricetag-outline',
  Tag: 'pricetag-outline',
  SupportAgent: 'headset-outline',
  Sparkles: 'sparkles-outline',
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { addToCart } = useCart();
  const { userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banners, setBanners] = useState<FeaturedImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [cards, setCards] = useState<FeatureCard[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<FlatList<FeaturedImage>>(null);

  const load = useCallback(async (force = false) => {
    // Use cache if fresh and not forcing a refresh
    if (!force && homeCache && Date.now() - homeCache.timestamp < CACHE_TTL) {
      setBanners(homeCache.data.banners);
      setCategories(homeCache.data.categories);
      setBestSellers(homeCache.data.bestSellers);
      setFeatured(homeCache.data.featured);
      setCards(homeCache.data.cards);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    try {
      const [fi, cats, bs, fp, fc] = await Promise.all([
        getFeaturedImages(),
        getCategories(),
        getBestSellers(),
        getFeaturedProducts(),
        getFeatureCards(),
      ]);
      const data: HomeCacheData = {
        banners: fi, categories: cats, bestSellers: bs, featured: fp, cards: fc,
      };
      homeCache = { data, timestamp: Date.now() };
      setBanners(fi);
      setCategories(cats);
      setBestSellers(bs);
      setFeatured(fp);
      setCards(fc);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load on first mount
  useEffect(() => {
    load();
  }, [load]);

  // Re-validate cache on screen focus (uses cache if fresh, avoids re-fetch)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // auto-advance the banner carousel
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % banners.length;
        bannerRef.current?.scrollToOffset({ offset: next * BANNER_W, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [banners.length]);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy900} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.brand}>Spraxe</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Products')}>
          <Ionicons name="search" size={24} color={colors.navy900} />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Hero banner carousel */}
      {banners.length > 0 && (
        <View>
          <FlatList
            ref={bannerRef}
            data={banners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(b) => String(b.id)}
            onMomentumScrollEnd={(e) =>
              setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / BANNER_W))
            }
            renderItem={({ item }) => (
              <View style={[styles.banner, { width: BANNER_W }]}>
                <FallbackImage uri={item.image_url} style={styles.bannerImg} borderRadius={12} />
                {(item.title || item.description) && (
                  <View style={styles.bannerOverlay}>
                    {item.title && <Text style={styles.bannerTitle}>{item.title}</Text>}
                    {item.description && (
                      <Text style={styles.bannerDesc}>{item.description}</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          />
          <View style={styles.dots}>
            {banners.map((b, i) => (
              <View
                key={b.id}
                style={[styles.dot, i === bannerIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Category rail */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Categories' })}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.categoryChip}
                onPress={() =>
                  navigation.navigate('Products', { categoryId: c.id, categoryName: c.name })
                }
              >
                <FallbackImage
                  uri={c.image_url}
                  style={styles.categoryImg}
                  borderRadius={28}
                  iconName="grid-outline"
                />
                <Text numberOfLines={1} style={styles.categoryName}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Best Sellers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {bestSellers.map((p) => (
              <View key={p.id} style={styles.railCard}>
                <ProductCard product={p} onPress={openProduct} onAddToCart={handleAdd} width={160} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Featured Products - FlatList with numColumns=2 */}
      {featured.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <FlatList
            data={featured}
            numColumns={2}
            scrollEnabled={false}
            keyExtractor={(p) => p.id}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            removeClippedSubviews
            renderItem={({ item }) => (
              <View style={styles.gridCell}>
                <ProductCard product={item} onPress={openProduct} onAddToCart={handleAdd} />
              </View>
            )}
          />
        </View>
      )}

      {/* Why Shop With Spraxe */}
      {cards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Shop With Spraxe</Text>
          <View style={styles.featureGrid}>
            {cards.map((c) => (
              <View key={c.id} style={styles.featureCard}>
                <Ionicons
                  name={iconMap[c.icon ?? 'Sparkles'] ?? 'sparkles-outline'}
                  size={26}
                  color={colors.orange500}
                />
                <Text style={styles.featureTitle}>{c.title}</Text>
                <Text style={styles.featureDesc}>{c.description}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brand: { fontSize: 24, fontWeight: '800', color: colors.navy900 },
  error: { color: colors.destructive, marginBottom: 8 },
  banner: { height: 170 },
  bannerImg: { width: '100%', height: 170 },
  bannerOverlay: { position: 'absolute', left: 16, bottom: 16, right: 16 },
  bannerTitle: { color: colors.white, fontSize: 18, fontWeight: '800' },
  bannerDesc: { color: colors.white, fontSize: 13, marginTop: 2 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gray100 },
  dotActive: { backgroundColor: colors.navy900, width: 18 },
  section: { marginTop: 24 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray900, marginBottom: 12 },
  seeAll: { color: colors.orange500, fontWeight: '600' },
  rail: { gap: 12, paddingRight: 8 },
  railCard: {},
  categoryChip: { alignItems: 'center', width: 72 },
  categoryImg: { width: 56, height: 56, backgroundColor: colors.gray100 },
  categoryName: { fontSize: 12, color: colors.gray900, marginTop: 6, textAlign: 'center' },
  grid: { paddingBottom: 4 },
  row: { justifyContent: 'space-between' },
  gridCell: { width: '48%', marginBottom: 12 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  featureTitle: { fontSize: 14, fontWeight: '700', color: colors.navy900 },
  featureDesc: { fontSize: 12, color: colors.textMuted },
});
