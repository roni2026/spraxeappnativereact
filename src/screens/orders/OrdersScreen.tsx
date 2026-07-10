import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { formatCurrency } from '../../theme/theme';
import { getMyOrders } from '../../data/order';
import { OrderRow } from '../../types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusColor: Record<string, string> = {
  pending: colors.orange500,
  confirmed: colors.navy800,
  processing: colors.navy800,
  shipped: colors.navy800,
  delivered: colors.success,
  cancelled: colors.destructive,
  refunded: colors.destructive,
};

export function StatusBadge({ status }: { status: string }) {
  const c = statusColor[status] ?? colors.gray600;
  return (
    <View style={[styles.badge, { backgroundColor: `${c}22`, borderColor: c }]}>
      <Text style={[styles.badgeText, { color: c }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

export default function OrdersScreen() {
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setOrders(await getMyOrders());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="receipt-outline" size={56} color={colors.gray600} />
        <Text style={styles.empty}>You have no orders yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.flex}
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate('OrderDetail', {
              orderId: item.id,
              orderNumber: item.order_number ?? undefined,
            })
          }
        >
          <View style={styles.cardHead}>
            <Text style={styles.orderNo}>{item.order_number ?? `Order ${item.id.slice(0, 8)}`}</Text>
            <StatusBadge status={item.status} />
          </View>
          {item.created_at && (
            <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
          )}
          <View style={styles.cardFoot}>
            <Text style={styles.total}>{formatCurrency(item.total)}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  error: { color: colors.destructive },
  retry: { color: colors.orange500, fontWeight: '700' },
  empty: { color: colors.textMuted },
  list: { padding: 16 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  date: { color: colors.gray600, fontSize: 12 },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 16, fontWeight: '800', color: colors.navy900 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
