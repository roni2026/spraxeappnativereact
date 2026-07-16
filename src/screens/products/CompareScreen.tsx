import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { formatCurrency } from '../../theme/theme';
import FallbackImage from '../../components/FallbackImage';
import { useCompare } from '../../context/CompareContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CompareScreen() {
  const { items, remove, clear, maxItems } = useCompare();
  const navigation = useNavigation<Nav>();

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No products to compare</Text>
        <Text style={styles.emptySub}>Add up to {maxItems} products from product pages.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Products', {})}>
          <Text style={styles.btnText}>Browse products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView horizontal style={styles.flex} contentContainerStyle={styles.row}>
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <FallbackImage uri={item.image} style={styles.img} widthHint={320} contentFit="contain" />
          <Text style={styles.name} numberOfLines={3}>{item.name}</Text>
          <Text style={styles.price}>{item.price != null ? formatCurrency(item.price) : '—'}</Text>
          <Text style={styles.stock}>
            {(item.stock_quantity ?? 0) > 0 ? 'In stock' : 'Out of stock'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { slug: item.slug ?? item.id, name: item.name })}>
            <Text style={styles.link}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => remove(item.id)}>
            <Text style={styles.remove}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.clear} onPress={clear}>
        <Text style={styles.clearText}>Clear all</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  row: { padding: 16, gap: 12, alignItems: 'flex-start' },
  card: {
    width: 180, padding: 12, borderRadius: 16, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  img: { width: '100%', height: 140, borderRadius: 12, backgroundColor: colors.gray100 },
  name: { marginTop: 8, fontWeight: '700', color: colors.navy900, minHeight: 54 },
  price: { marginTop: 6, fontWeight: '800', color: colors.navy900 },
  stock: { marginTop: 4, fontSize: 12, color: colors.gray600 },
  link: { marginTop: 10, color: colors.navy900, fontWeight: '700' },
  remove: { marginTop: 6, color: colors.destructive, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.navy900 },
  emptySub: { marginTop: 8, color: colors.gray600, textAlign: 'center' },
  btn: { marginTop: 16, backgroundColor: colors.navy900, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
  clear: { alignSelf: 'center', padding: 16 },
  clearText: { color: colors.destructive, fontWeight: '700' },
});
