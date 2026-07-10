import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FallbackImage from './FallbackImage';
import { colors } from '../theme/colors';
import { formatCurrency } from '../theme/theme';
import { Product, displayPrice, thumbnail } from '../types/models';

interface Props {
  product: Product;
  onPress: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  wishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  width?: number;
}

export default function ProductCard({
  product,
  onPress,
  onAddToCart,
  wishlisted,
  onToggleWishlist,
  width,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, width ? { width } : styles.flex]}
      onPress={() => onPress(product)}
    >
      <View style={styles.imageWrap}>
        <FallbackImage
          uri={thumbnail(product)}
          style={styles.image}
          iconName="cube-outline"
        />
        {onToggleWishlist && (
          <TouchableOpacity
            style={styles.heart}
            onPress={() => onToggleWishlist(product)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={18}
              color={wishlisted ? colors.destructive : colors.gray600}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatCurrency(displayPrice(product))}</Text>
        {onAddToCart && (
          <TouchableOpacity style={styles.addBtn} onPress={() => onAddToCart(product)}>
            <Ionicons name="cart-outline" size={16} color={colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  flex: { flex: 1 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.gray100 },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 6,
  },
  body: { padding: 10, gap: 6 },
  name: { fontSize: 13, color: colors.gray900, minHeight: 34 },
  price: { fontSize: 15, fontWeight: '700', color: colors.navy900 },
  addBtn: {
    marginTop: 2,
    backgroundColor: colors.orange500,
    borderRadius: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  addBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
});
