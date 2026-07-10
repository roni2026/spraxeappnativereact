import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { formatCurrency } from '../../theme/theme';
import { getOrderDetail } from '../../data/order';
import { OrderItemRow, OrderRow } from '../../types/models';
import { StatusBadge } from './OrdersScreen';

type Rt = RouteProp<RootStackParamList, 'OrderDetail'>;

const TIMELINE = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const CANCELLED_STATES = ['cancelled', 'refunded'];

export default function OrderDetailScreen() {
  const route = useRoute<Rt>();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { order: o, items: it } = await getOrderDetail(route.params.orderId);
      setOrder(o);
      setItems(it);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [route.params.orderId]);

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
  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Order not found'}</Text>
        <TouchableOpacity onPress={load}>
          <Text style={styles.retry}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCancelled = CANCELLED_STATES.includes(order.status);
  const currentIndex = TIMELINE.indexOf(order.status);
  const subtotal = order.subtotal ?? items.reduce((s, i) => s + i.total_price, 0);
  const shipping = order.shipping_cost ?? Math.max(0, order.total - subtotal);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.headRow}>
        <Text style={styles.orderNo}>{order.order_number ?? `Order ${order.id.slice(0, 8)}`}</Text>
        <StatusBadge status={order.status} />
      </View>
      {order.created_at && (
        <Text style={styles.date}>Placed {new Date(order.created_at).toLocaleString()}</Text>
      )}

      {/* Status timeline / cancelled banner */}
      {isCancelled ? (
        <View style={styles.cancelBanner}>
          <Ionicons name="alert-circle" size={20} color={colors.destructive} />
          <Text style={styles.cancelText}>
            This order was {order.status}.
          </Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {TIMELINE.map((step, i) => {
            const done = i <= currentIndex;
            return (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineIndicator}>
                  <View style={[styles.dot, done && styles.dotDone]}>
                    {done && <Ionicons name="checkmark" size={12} color={colors.white} />}
                  </View>
                  {i < TIMELINE.length - 1 && (
                    <View style={[styles.line, i < currentIndex && styles.lineDone]} />
                  )}
                </View>
                <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Items */}
      <Text style={styles.sectionTitle}>Items</Text>
      {items.map((it, idx) => (
        <View key={it.id ?? idx} style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text numberOfLines={2} style={styles.itemName}>
              {it.product_name ?? 'Product'}
            </Text>
            <Text style={styles.itemQty}>
              {it.quantity} × {formatCurrency(it.unit_price)}
            </Text>
          </View>
          <Text style={styles.itemTotal}>{formatCurrency(it.total_price)}</Text>
        </View>
      ))}

      {/* Delivery + payment */}
      <Text style={styles.sectionTitle}>Delivery</Text>
      <View style={styles.infoBox}>
        {order.contact_number ? (
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Contact: </Text>
            {order.contact_number}
          </Text>
        ) : null}
        {order.shipping_address ? (
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Address: </Text>
            {order.shipping_address}
          </Text>
        ) : null}
        {order.delivery_location ? (
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Zone: </Text>
            {order.delivery_location === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'}
          </Text>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Payment</Text>
      <View style={styles.infoBox}>
        {order.payment_method ? (
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Method: </Text>
            {order.payment_method}
          </Text>
        ) : null}
        {order.payment_status ? (
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Status: </Text>
            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
          </Text>
        ) : null}
        {order.payment_transaction_id ? (
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Transaction ID: </Text>
            {order.payment_transaction_id}
          </Text>
        ) : null}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Shipping</Text>
          <Text style={styles.totalValue}>{formatCurrency(shipping)}</Text>
        </View>
        {typeof order.discount === 'number' && order.discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={styles.totalValue}>-{formatCurrency(order.discount)}</Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandRow]}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>{formatCurrency(order.total)}</Text>
        </View>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  error: { color: colors.destructive },
  retry: { color: colors.orange500, fontWeight: '700' },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { fontSize: 18, fontWeight: '800', color: colors.gray900 },
  date: { color: colors.gray600, fontSize: 12, marginTop: 4 },
  cancelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.destructive}18`,
    borderWidth: 1,
    borderColor: colors.destructive,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  cancelText: { color: colors.destructive, fontWeight: '600' },
  timeline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineIndicator: { alignItems: 'center', width: 24 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  line: { width: 2, height: 26, backgroundColor: colors.border },
  lineDone: { backgroundColor: colors.navy900 },
  timelineLabel: { marginLeft: 12, marginTop: 1, color: colors.gray600, fontSize: 14 },
  timelineLabelDone: { color: colors.gray900, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.gray900, marginTop: 22, marginBottom: 8 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { color: colors.gray900, fontWeight: '600' },
  itemQty: { color: colors.gray600, fontSize: 12 },
  itemTotal: { color: colors.navy900, fontWeight: '700', marginLeft: 8 },
  infoBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  infoLine: { color: colors.gray900, lineHeight: 20 },
  infoLabel: { color: colors.gray600, fontWeight: '600' },
  totals: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: colors.gray600 },
  totalValue: { color: colors.gray900, fontWeight: '600' },
  grandRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  grandLabel: { fontSize: 16, fontWeight: '800', color: colors.gray900 },
  grandValue: { fontSize: 16, fontWeight: '800', color: colors.navy900 },
});
