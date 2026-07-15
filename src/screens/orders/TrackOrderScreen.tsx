import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { trackOrderByNumber } from '../../data/catalog';
import { formatCurrency } from '../../theme/theme';

export default function TrackOrderScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const row = await trackOrderByNumber(query.trim());
      if (!row) setError('No order found. Check the order number and try again.');
      else setOrder(row);
    } catch (e: any) {
      setError(e?.message ?? 'Could not track order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Track your order</Text>
      <Text style={styles.sub}>Enter the order number from your confirmation SMS or invoice.</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="e.g. SPX-1024"
          placeholderTextColor={colors.gray600}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={search}
        />
        <TouchableOpacity style={styles.btn} onPress={search} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="search" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {order ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{order.order_number || order.id}</Text>
          <Text style={styles.line}>Status: <Text style={styles.bold}>{String(order.status || 'processing')}</Text></Text>
          {order.total != null ? <Text style={styles.line}>Total: {formatCurrency(Number(order.total))}</Text> : null}
          {order.payment_method ? <Text style={styles.line}>Payment: {order.payment_method}</Text> : null}
          {order.shipping_address ? <Text style={styles.line}>Ship to: {order.shipping_address}</Text> : null}
          {order.created_at ? <Text style={styles.muted}>Placed {new Date(order.created_at).toLocaleString()}</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.navy900 },
  sub: { marginTop: 6, color: colors.gray600, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, backgroundColor: colors.surface, color: colors.navy900,
  },
  btn: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: colors.navy900,
    alignItems: 'center', justifyContent: 'center',
  },
  error: { marginTop: 12, color: colors.destructive },
  card: {
    marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.navy900, marginBottom: 8 },
  line: { color: colors.gray600, marginTop: 4 },
  bold: { fontWeight: '700', color: colors.navy900 },
  muted: { marginTop: 10, fontSize: 12, color: colors.gray600 },
});
