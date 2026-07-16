import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { formatCurrency } from '../../theme/theme';
import FallbackImage from '../../components/FallbackImage';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getWishlist, removeFromWishlist } from '../../data/wishlist';
import { WishlistItemRow, displayPrice, thumbnail } from '../../types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WishlistScreen() {
  const navigation = useNavigation<Nav>();
  const { addToCart } = useCart();
  const { userId } = useAuth();
  const [items, setItems] = useState<WishlistItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await getWishlist());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    } catch {
      /* ignore */
    }
  };

  const handleAdd = async (productId: string) => {
    try {
      await addToCart(productId);
      Alert.alert('Added to cart');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not add to cart');
    }
  };

  if (!userId) {
    return (
      <View style={styles.center}>
        <Ionicons name="heart-outline" size={56} color={colors.gray600} />
        <Text style={styles.empty}>Sign in to view your wishlist</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy900} size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={load}>
          <Text style={styles.retry}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="heart-outline" size={56} color={colors.gray600} />
        <Text style={styles.empty}>Your wishlist is empty</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.flex}
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.left}
            onPress={() =>
              item.product &&
              navigation.navigate('ProductDetail', {
                slug: item.product.slug ?? item.product.id,
                name: item.product.name,
              })
            }
          >
            <FallbackImage
              uri={item.product ? thumbnail(item.product) : undefined}
              style={styles.img}
              borderRadius={10}
              iconName="cube-outline"
              widthHint={200}
            />
            <View style={styles.body}>
              <Text numberOfLines={2} style={styles.name}>
                {item.product?.name ?? 'Product'}
              </Text>
              <Text style={styles.price}>
                {formatCurrency(item.product ? displayPrice(item.product) : 0)}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item.product_id)}>
              <Ionicons name="cart-outline" size={16} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRemove(item.product_id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  empty: { color: colors.textMuted },
  error: { color: colors.destructive },
  retry: { color: colors.orange500, fontWeight: '700' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  img: { width: 64, height: 64, backgroundColor: colors.gray100 },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '600', color: colors.gray900 },
  price: { color: colors.navy900, fontWeight: '700' },
  actions: { alignItems: 'center', gap: 12, marginLeft: 8 },
  addBtn: { backgroundColor: colors.orange500, borderRadius: 8, padding: 8 },
  primaryBtn: {
    backgroundColor: colors.navy900,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
