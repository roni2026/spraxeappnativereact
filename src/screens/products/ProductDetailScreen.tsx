import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { formatCurrency } from '../../theme/theme';
import FallbackImage from '../../components/FallbackImage';
import RatingStars from '../../components/RatingStars';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getProductBySlug } from '../../data/catalog';
import { isWishlisted, toggleWishlist } from '../../data/wishlist';
import {
  ReviewSummary,
  deleteMyReview,
  getReviews,
  hasDeliveredPurchase,
  myReview as findMyReview,
  submitReview,
  summarize,
} from '../../data/review';
import { Product, ProductReviewRow, displayPrice } from '../../types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'ProductDetail'>;
const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { addToCart } = useCart();
  const { userId } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [wished, setWished] = useState(false);
  const [adding, setAdding] = useState(false);

  const [reviews, setReviews] = useState<ProductReviewRow[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({ average: 0, count: 0 });
  const [mine, setMine] = useState<ProductReviewRow | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [draftRating, setDraftRating] = useState(5);
  const [draftComment, setDraftComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async (productId: string) => {
    const rows = await getReviews(productId);
    setReviews(rows);
    setSummary(summarize(rows));
    const own = await findMyReview(rows);
    setMine(own);
    if (own) {
      setDraftRating(own.rating);
      setDraftComment(own.comment ?? '');
    }
    try {
      setCanReview(await hasDeliveredPurchase(productId));
    } catch {
      setCanReview(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getProductBySlug(route.params.slug);
      if (!p) {
        setError('Product not found');
        return;
      }
      setProduct(p);
      navigation.setOptions({ title: p.name });
      if (userId) {
        try {
          setWished(await isWishlisted(p.id));
        } catch {
          /* ignore */
        }
      }
      await loadReviews(p.id);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [route.params.slug, userId, loadReviews, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  const requireLogin = (): boolean => {
    if (!userId) {
      navigation.navigate('Login');
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!product || !requireLogin()) return;
    setAdding(true);
    try {
      await addToCart(product.id, qty);
      Alert.alert('Added to cart', `${qty} × ${product.name}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || !requireLogin()) return;
    try {
      setWished(await toggleWishlist(product.id));
    } catch {
      /* ignore */
    }
  };

  const handleSubmitReview = async () => {
    if (!product) return;
    setSubmitting(true);
    try {
      await submitReview(product.id, draftRating, draftComment, true);
      await loadReviews(product.id);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!product) return;
    try {
      await deleteMyReview(product.id);
      setMine(null);
      setDraftComment('');
      setDraftRating(5);
      await loadReviews(product.id);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy900} size="large" />
      </View>
    );
  }
  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Product not found'}</Text>
        <TouchableOpacity onPress={load}>
          <Text style={styles.retry}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [undefined];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) =>
          setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <FallbackImage uri={item} style={{ width, height: width }} iconName="cube-outline" />
        )}
      />
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
          ))}
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{product.name}</Text>
          <TouchableOpacity onPress={handleToggleWishlist} hitSlop={8}>
            <Ionicons
              name={wished ? 'heart' : 'heart-outline'}
              size={26}
              color={wished ? colors.destructive : colors.gray600}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.price}>{formatCurrency(displayPrice(product))}</Text>

        {summary.count > 0 && (
          <View style={styles.ratingRow}>
            <RatingStars rating={summary.average} size={16} />
            <Text style={styles.ratingText}>
              {summary.average.toFixed(1)} ({summary.count})
            </Text>
          </View>
        )}

        {typeof product.stock_quantity === 'number' && (
          <Text style={product.stock_quantity > 0 ? styles.inStock : styles.outStock}>
            {product.stock_quantity > 0 ? `In stock (${product.stock_quantity})` : 'Out of stock'}
          </Text>
        )}

        {product.description ? (
          <Text style={styles.description}>{product.description}</Text>
        ) : null}

        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
              <Ionicons name="remove" size={18} color={colors.navy900} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{qty}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setQty((q) => q + 1)}>
              <Ionicons name="add" size={18} color={colors.navy900} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding}>
          {adding ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="cart" size={18} color={colors.white} />
              <Text style={styles.addBtnText}>Add to Cart</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Reviews */}
        <Text style={styles.sectionTitle}>Reviews ({summary.count})</Text>

        {canReview && (
          <View style={styles.reviewForm}>
            <Text style={styles.reviewFormTitle}>
              {mine ? 'Update your review' : 'Write a review'}
            </Text>
            <RatingStars rating={draftRating} editable size={26} onChange={setDraftRating} />
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your thoughts (optional)"
              placeholderTextColor={colors.gray600}
              value={draftComment}
              onChangeText={setDraftComment}
              multiline
            />
            <View style={styles.reviewActions}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReview} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>{mine ? 'Update' : 'Submit'}</Text>
                )}
              </TouchableOpacity>
              {mine && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteReview}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {reviews.length === 0 ? (
          <Text style={styles.empty}>No reviews yet.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHead}>
                <RatingStars rating={r.rating} size={14} />
                {r.verified_purchase && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text style={styles.verifiedText}>Verified Purchase</Text>
                  </View>
                )}
              </View>
              {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              {r.created_at && (
                <Text style={styles.reviewDate}>
                  {new Date(r.created_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.background },
  error: { color: colors.destructive },
  retry: { color: colors.orange500, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gray100 },
  dotActive: { backgroundColor: colors.navy900, width: 18 },
  body: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  name: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.gray900 },
  price: { fontSize: 22, fontWeight: '800', color: colors.navy900, marginTop: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  ratingText: { color: colors.textMuted, fontSize: 13 },
  inStock: { color: colors.success, marginTop: 8, fontWeight: '600' },
  outStock: { color: colors.destructive, marginTop: 8, fontWeight: '600' },
  description: { color: colors.gray600, marginTop: 12, lineHeight: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  qtyLabel: { fontSize: 15, fontWeight: '600', color: colors.gray900 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  stepBtn: { padding: 10 },
  qtyValue: { minWidth: 32, textAlign: 'center', fontWeight: '700', color: colors.gray900 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.navy900,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 20,
  },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray900, marginTop: 28, marginBottom: 12 },
  reviewForm: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  reviewFormTitle: { fontWeight: '700', color: colors.navy900 },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    color: colors.gray900,
  },
  reviewActions: { flexDirection: 'row', gap: 12 },
  submitBtn: {
    backgroundColor: colors.orange500,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  submitBtnText: { color: colors.white, fontWeight: '700' },
  deleteBtn: { borderRadius: 10, paddingVertical: 11, paddingHorizontal: 20, justifyContent: 'center' },
  deleteBtnText: { color: colors.destructive, fontWeight: '700' },
  empty: { color: colors.textMuted, marginVertical: 12 },
  reviewCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { color: colors.success, fontSize: 11, fontWeight: '600' },
  reviewComment: { color: colors.gray900 },
  reviewDate: { color: colors.gray600, fontSize: 12 },
});
