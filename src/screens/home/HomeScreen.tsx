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
  getHeroImages,
  getInfoCarouselImages,
  getFeaturedProducts,
  getNewArrivals,
} from '../../data/catalog';
import { Category, FeatureCard, FeaturedImage, Product } from '../../types/models';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../components/LanguageToggle';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const BANNER_W = width - 32;

interface HomeCacheData {
  banners: FeaturedImage[];
  infoCarousel: FeaturedImage[];
  categories: Category[];
  bestSellers: Product[];
  featured: Product[];
  newArrivals: Product[];
  cards: FeatureCard[];
}
let homeCache: { data: HomeCacheData; timestamp: number } | null = null;
const CACHE_TTL = 30_000;

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Truck: 'car-outline',
  LocalShipping: 'car-outline',
  Shield: 'shield-checkmark-outline',
  Verified: 'checkmark-circle-outline',
  Sell: 'pricetag-outline',
  Tag: 'pricetag-outline',
  SupportAgent: 'headset-outline',
  Headset: 'headset-outline',
  Return: 'arrow-undo-outline',
  CreditCard: 'card-outline',
  Payment: 'card-outline',
  Warranty: 'shield-checkmark-outline',
  Delivery: 'bicycle-outline',
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { addToCart } = useCart();
  const { userId } = useAuth();

  const [banners, setBanners] = useState<FeaturedImage[]>([]);
  const [infoCarousel, setInfoCarousel] = useState<FeaturedImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [cards, setCards] = useState<FeatureCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeInfoSlide, setActiveInfoSlide] = useState(0);
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const infoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    // Use cache if fresh
    if (!isRefresh && homeCache && Date.now() - homeCache.timestamp < CACHE_TTL) {
      const d = homeCache.data;
      setBanners(d.banners);
      setInfoCarousel(d.infoCarousel);
      setCategories(d.categories);
      setBestSellers(d.bestSellers);
      setFeatured(d.featured);
      setNewArrivals(d.newArrivals);
      setCards(d.cards);
      setLoading(false);
      return;
    }

    try {
      const [heroImages, infoImages, cats, featuredProds, bestProds, newProds, featureCards] = await Promise.all([
        getHeroImages(),
        getInfoCarouselImages(),
        getCategories(),
        getFeaturedProducts(),
        getBestSellers(),
        getNewArrivals(),
        getFeatureCards(),
      ]);

      const data: HomeCacheData = {
        banners: heroImages,
        infoCarousel: infoImages,
        categories: cats,
        bestSellers: bestProds,
        featured: featuredProds,
        newArrivals: newProds,
        cards: featureCards,
      };
      homeCache = { data, timestamp: Date.now() };

      setBanners(heroImages);
      setInfoCarousel(infoImages);
      setCategories(cats);
      setBestSellers(bestProds);
      setFeatured(featuredProds);
      setNewArrivals(newProds);
      setCards(featureCards);
    } catch (e: any) {
      console.warn('[home] load error:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-scroll banners
  useEffect(() => {
    if (banners.length <= 1) return;
    bannerTimer.current = setInterval(() => {
      setActiveBanner((p) => (p + 1) % banners.length);
    }, 4000);
    return () => {
      if (bannerTimer.current) clearInterval(bannerTimer.current);
    };
  }, [banners.length]);

  // Auto-scroll info carousel
  useEffect(() => {
    if (infoCarousel.length <= 1) return;
    infoTimer.current = setInterval(() => {
      setActiveInfoSlide((p) => (p + 1) % infoCarousel.length);
    }, 3500);
    return () => {
      if (infoTimer.current) clearInterval(infoTimer.current);
    };
  }, [infoCarousel.length]);

  useFocusEffect(
    useCallback(() => {
      if (homeCache && Date.now() - homeCache.timestamp > CACHE_TTL) {
        loadData(true);
      }
    }, [loadData]),
  );

  const onRefresh = () => loadData(true);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.navy900} />
      </View>
    );
  }

  const renderProductGrid = (products: Product[]) => {
    const pairs: Product[][] = [];
    for (let i = 0; i < products.length; i += 2) {
      pairs.push(products.slice(i, i + 2));
    }
    return pairs.map((pair, idx) => (
      <View key={idx} style={styles.row}>
        {pair.map((p) => (
          <View key={p.id} style={styles.gridCell}>
            <ProductCard
              product={p}
              onPress={() => navigation.navigate('ProductDetail', { id: p.slug ?? p.id, name: p.name })}
              onAddToCart={() => addToCart(p)}
            />
          </View>
        ))}
      </View>
    ));
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>SPRAXE</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LanguageToggle />
          <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Ionicons name="search-outline" size={22} color={colors.navy900} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Banner Carousel */}
      {banners.length > 0 && (
        <View style={styles.bannerWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveBanner(idx);
            }}
            scrollEventThrottle={200}
          >
            {banners.map((b, i) => (
              <TouchableOpacity
                key={b.id}
                activeOpacity={0.9}
                onPress={() => {
                  if (b.link_url) {
                    // Could open link in WebView or navigate
                  }
                }}
                style={styles.banner}
              >
                <FallbackImage
                  uri={b.image_url}
                  style={styles.bannerImg}
                  resizeMode="cover"
                />
                {(b.title || b.description) && (
                  <View style={styles.bannerOverlay}>
                    {b.title && <Text style={styles.bannerTitle}>{b.title}</Text>}
                    {b.description && <Text style={styles.bannerDesc}>{b.description}</Text>}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {banners.length > 1 && (
            <View style={styles.dots}>
              {banners.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeBanner && styles.activeDot]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Feature cards */}
      {cards.length > 0 && (
        <View style={styles.section}>
          <View style={styles.featureGrid}>
            {cards.map((card) => {
              const iconName = card.icon ? iconMap[card.icon] ?? 'star-outline' : 'star-outline';
              return (
                <View key={card.id} style={styles.featureCard}>
                  <Ionicons name={iconName} size={24} color={colors.navy900} />
                  <Text style={styles.featureTitle}>{card.title}</Text>
                  <Text style={styles.featureDesc}>{card.description}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryChip}
                onPress={() => navigation.navigate('Products', { categoryId: item.id })}
              >
                <FallbackImage
                  uri={item.image_url}
                  style={styles.categoryImg}
                  resizeMode="cover"
                />
                <Text style={styles.categoryName} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.rail}
          />
        </View>
      )}

      {/* Info Carousel (from website's info_carousel placement) */}
      {infoCarousel.length > 0 && (
        <View style={styles.section}>
          <View style={styles.infoCarouselWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                setActiveInfoSlide(idx);
              }}
              scrollEventThrottle={200}
            >
              {infoCarousel.map((img) => (
                <View key={img.id} style={styles.infoCarouselItem}>
                  <FallbackImage
                    uri={img.image_url}
                    style={styles.infoCarouselImg}
                    resizeMode="cover"
                  />
                  {img.title && (
                    <View style={styles.infoCarouselOverlay}>
                      <Text style={styles.infoCarouselTitle}>{img.title}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            {infoCarousel.length > 1 && (
              <View style={styles.dots}>
                {infoCarousel.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === activeInfoSlide && styles.activeDot]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.featured')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={featured}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: 160, marginRight: 12 }}>
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { id: item.slug ?? item.id, name: item.name })}
                  onAddToCart={() => addToCart(item)}
                />
              </View>
            )}
            contentContainerStyle={styles.rail}
          />
        </View>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.bestSellers')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={bestSellers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: 160, marginRight: 12 }}>
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { id: item.slug ?? item.id, name: item.name })}
                  onAddToCart={() => addToCart(item)}
                />
              </View>
            )}
            contentContainerStyle={styles.rail}
          />
        </View>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Arrivals</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={newArrivals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: 160, marginRight: 12 }}>
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { id: item.slug ?? item.id, name: item.name })}
                  onAddToCart={() => addToCart(item)}
                />
              </View>
            )}
            contentContainerStyle={styles.rail}
          />
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: { fontSize: 22, fontWeight: '900', color: colors.navy900, letterSpacing: 1 },
  bannerWrap: { marginBottom: 16 },
  banner: { width, marginLeft: -16, height: 200 },
  bannerImg: { width: '100%', height: '100%' },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bannerDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gray300 },
  activeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.orange500, marginTop: 1 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.gray900, marginBottom: 12 },
  seeAll: { color: colors.orange500, fontWeight: '600' },
  rail: { gap: 12, paddingRight: 8 },
  categoryChip: { alignItems: 'center', width: 72 },
  categoryImg: { width: 56, height: 56, backgroundColor: colors.gray100, borderRadius: 28 },
  categoryName: { fontSize: 11, color: colors.gray900, marginTop: 6, textAlign: 'center' },
  grid: { paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
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
  infoCarouselWrap: { borderRadius: 12, overflow: 'hidden' },
  infoCarouselItem: { width: width - 32, height: 200 },
  infoCarouselImg: { width: '100%', height: '100%' },
  infoCarouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  infoCarouselTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
