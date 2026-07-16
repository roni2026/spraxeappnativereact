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
  Image,
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
  getFeatureCards,
  getHeroImages,
  getInfoCarouselImages,
  getFeaturedProducts,
  getNewArrivals,
} from '../../data/catalog';
import { prefetchImages } from '../../lib/cloudinary';
import { FeatureCard, FeaturedImage, Product } from '../../types/models';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../components/LanguageToggle';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

interface HomeCacheData {
  banners: FeaturedImage[];
  infoCarousel: FeaturedImage[];
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
      setBestSellers(d.bestSellers);
      setFeatured(d.featured);
      setNewArrivals(d.newArrivals);
      setCards(d.cards);
      setLoading(false);
      return;
    }

    try {
      const [heroImages, infoImages, featuredProds, bestProds, newProds, featureCards] = await Promise.all([
        getHeroImages(),
        getInfoCarouselImages(),
        getFeaturedProducts(),
        getBestSellers(),
        getNewArrivals(),
        getFeatureCards(),
      ]);

      const data: HomeCacheData = {
        banners: heroImages,
        infoCarousel: infoImages,
        bestSellers: bestProds,
        featured: featuredProds,
        newArrivals: newProds,
        cards: featureCards,
      };
      homeCache = { data, timestamp: Date.now() };

      setBanners(heroImages);
      setInfoCarousel(infoImages);
      setBestSellers(bestProds);
      setFeatured(featuredProds);
      setNewArrivals(newProds);
      setCards(featureCards);

      // Prefetch product images for smoother scrolling
      const allProducts = [...featuredProds, ...bestProds, ...newProds];
      const thumbs = allProducts
        .map((p) => (p.images && p.images.length > 0 ? p.images[0] : null))
        .filter(Boolean) as string[];
      prefetchImages(thumbs, 400);
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

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header bar with logo image */}
      <View style={styles.topBar}>
        <Image
          source={require('../../../assets/header_logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LanguageToggle />
          <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Ionicons name="search-outline" size={22} color={colors.navy900} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Banner Carousel - full width, no cropping */}
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
                  uri={b.mobile_image_url || b.image_url}
                  style={styles.bannerImg}
                  resizeMode="contain"
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

      {/* New Arrivals - 8 ads (shown first) */}
      {newArrivals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.newArrivals')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={newArrivals.slice(0, 8)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: 160, marginRight: 12 }}>
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { slug: item.slug ?? item.id, name: item.name })}
                  onAddToCart={() => addToCart(item)}
                />
              </View>
            )}
            contentContainerStyle={styles.rail}
          />
        </View>
      )}

      {/* Featured Products - 6 ads */}
      {featured.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.featuredAds')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={featured.slice(0, 6)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: 160, marginRight: 12 }}>
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { slug: item.slug ?? item.id, name: item.name })}
                  onAddToCart={() => addToCart(item)}
                />
              </View>
            )}
            contentContainerStyle={styles.rail}
          />
        </View>
      )}

      {/* Best Sellers - 6 ads */}
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
            data={bestSellers.slice(0, 6)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: 160, marginRight: 12 }}>
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { slug: item.slug ?? item.id, name: item.name })}
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
  logoImage: {
    width: 120,
    height: 40,
  },
  bannerWrap: { marginBottom: 16 },
  banner: { width, marginLeft: -16, height: 220 },
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
