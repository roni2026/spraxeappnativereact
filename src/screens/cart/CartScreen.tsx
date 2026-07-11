import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { formatCurrency } from '../../theme/theme';
import FallbackImage from '../../components/FallbackImage';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  PAYMENT_METHODS,
  PaymentMethod,
  SHIPPING_INSIDE_DHAKA,
  SHIPPING_OUTSIDE_DHAKA,
  placeOrder,
} from '../../data/order';
import { getBusinessPhone } from '../../data/settings';
import { displayPrice, thumbnail } from '../../types/models';
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CartScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { items, loading, refresh, updateQuantity, removeItem } = useCart();
  const { userId, profile } = useAuth();

  const [insideDhaka, setInsideDhaka] = useState(true);
  const [payment, setPayment] = useState<PaymentMethod>('Cash on Delivery');
  const [txnId, setTxnId] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    getBusinessPhone().then(setBusinessPhone).catch(() => setBusinessPhone(null));
  }, []);

  useEffect(() => {
    if (profile) {
      if (profile.phone && !contact) setContact(profile.phone);
      if (profile.address && !address) setAddress(profile.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const subtotal = items.reduce(
    (s, it) => s + (it.product ? displayPrice(it.product) : 0) * it.quantity,
    0,
  );
  const shipping = insideDhaka ? SHIPPING_INSIDE_DHAKA : SHIPPING_OUTSIDE_DHAKA;
  const total = subtotal + shipping;

  const handleCheckout = useCallback(async () => {
    if (items.length === 0) return;
    if (!contact.trim()) {
      Alert.alert(t('cart.contactRequired'), t('cart.enterContactNumber'));
      return;
    }
    if (!address.trim()) {
      Alert.alert(t('cart.addressRequired'), t('cart.enterShippingAddress'));
      return;
    }
    if ((payment === 'bKash' || payment === 'Nagad') && !txnId.trim()) {
      Alert.alert(t('cart.txnIdRequired'), t('cart.enterTxnId', { method: payment }));
      return;
    }
    setPlacing(true);
    try {
      const order = await placeOrder({
        items,
        deliveryInsideDhaka: insideDhaka,
        contactPhone: contact.trim(),
        shippingAddress: address.trim(),
        paymentMethod: payment,
        paymentTransactionId: payment === 'Cash on Delivery' ? null : txnId.trim(),
      });
      await refresh();
      Alert.alert(t('cart.orderPlaced'), t('cart.orderPlacedMsg', { orderNumber: order.order_number ?? '' }), [
        {
          text: 'View Order',
          onPress: () =>
            navigation.navigate('OrderDetail', {
              orderId: order.id,
              orderNumber: order.order_number ?? undefined,
            }),
        },
      ]);
      setTxnId('');
    } catch (e: any) {
      Alert.alert(t('cart.checkoutFailed'), e?.message ?? t('cart.couldNotPlaceOrder'));
    } finally {
      setPlacing(false);
    }
  }, [items, contact, address, payment, txnId, insideDhaka, refresh, navigation]);

  if (!userId) {
    return (
      <View style={styles.center}>
        <Ionicons name="cart-outline" size={56} color={colors.gray600} />
        <Text style={styles.emptyTitle}>{t('cart.signInToViewCart')}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.primaryBtnText}>{t('auth.signIn')}</Text>
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

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cart-outline" size={56} color={colors.gray600} />
        <Text style={styles.emptyTitle}>{t('cart.emptyCart')}</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
        >
          <Text style={styles.primaryBtnText}>{t('cart.startShopping')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('cart.yourCart')}</Text>

      {items.map((it) => (
        <View key={it.id} style={styles.itemCard}>
          <FallbackImage
            uri={it.product ? thumbnail(it.product) : undefined}
            style={styles.itemImg}
            borderRadius={10}
            iconName="cube-outline"
          />
          <View style={styles.itemBody}>
            <Text numberOfLines={2} style={styles.itemName}>
              {it.product?.name ?? 'Product'}
            </Text>
            <Text style={styles.itemPrice}>
              {formatCurrency(it.product ? displayPrice(it.product) : 0)}
            </Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => updateQuantity(it.id, it.quantity - 1)}
              >
                <Ionicons name="remove" size={16} color={colors.navy900} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{it.quantity}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => updateQuantity(it.id, it.quantity + 1)}
              >
                <Ionicons name="add" size={16} color={colors.navy900} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => removeItem(it.id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      ))}

      {/* Delivery zone */}
      <Text style={styles.sectionTitle}>{t('cart.deliveryZone')}</Text>
      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentBtn, insideDhaka && styles.segmentActive]}
          onPress={() => setInsideDhaka(true)}
        >
          <Text style={[styles.segmentText, insideDhaka && styles.segmentTextActive]}>
            {t('cart.insideDhaka')} ({formatCurrency(SHIPPING_INSIDE_DHAKA)})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, !insideDhaka && styles.segmentActive]}
          onPress={() => setInsideDhaka(false)}
        >
          <Text style={[styles.segmentText, !insideDhaka && styles.segmentTextActive]}>
            {t('cart.outsideDhaka')} ({formatCurrency(SHIPPING_OUTSIDE_DHAKA)})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Payment method */}
      <Text style={styles.sectionTitle}>{t('cart.paymentMethod')}</Text>
      {PAYMENT_METHODS.map((m) => (
        <TouchableOpacity key={m} style={styles.radioRow} onPress={() => setPayment(m)}>
          <Ionicons
            name={payment === m ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={payment === m ? colors.navy900 : colors.gray600}
          />
          <Text style={styles.radioLabel}>{m}</Text>
        </TouchableOpacity>
      ))}

      {(payment === 'bKash' || payment === 'Nagad') && (
        <View style={styles.payBox}>
          {businessPhone ? (
            <Text style={styles.payHint}>
              {t('cart.sendMoneyTo', { method: payment })} <Text style={styles.payPhone}>{businessPhone}</Text>{t('cart.thenEnterTxnId')}
            </Text>
          ) : (
            <Text style={styles.payHint}>
              {t('cart.sendMoneyTo', { method: payment })}{t('cart.thenEnterTxnId')}
            </Text>
          )}
          <TextInput
            style={styles.input}
            placeholder={t('cart.transactionId')}
            placeholderTextColor={colors.gray600}
            value={txnId}
            onChangeText={setTxnId}
          />
        </View>
      )}

      {/* Contact + address */}
      <Text style={styles.sectionTitle}>{t('cart.contactNumber')}</Text>
      <TextInput
        style={styles.input}
        placeholder="01712345678"
        placeholderTextColor={colors.gray600}
        keyboardType="phone-pad"
        value={contact}
        onChangeText={setContact}
      />
      <Text style={styles.sectionTitle}>{t('cart.shippingAddress')}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder={t('cart.shippingAddress')}
        placeholderTextColor={colors.gray600}
        value={address}
        onChangeText={setAddress}
        multiline
      />

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('cart.subtotal')}</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('cart.shipping')}</Text>
          <Text style={styles.totalValue}>{formatCurrency(shipping)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandRow]}>
          <Text style={styles.grandLabel}>{t('cart.total')}</Text>
          <Text style={styles.grandValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} disabled={placing}>
        {placing ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.checkoutText}>{t('cart.placeOrder')}</Text>
        )}
      </TouchableOpacity>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.background,
    padding: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.gray900 },
  title: { fontSize: 24, fontWeight: '800', color: colors.navy900, marginBottom: 12 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  itemImg: { width: 64, height: 64, backgroundColor: colors.gray100 },
  itemBody: { flex: 1, gap: 4 },
  itemName: { fontSize: 14, color: colors.gray900, fontWeight: '600' },
  itemPrice: { color: colors.navy900, fontWeight: '700' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: 4,
  },
  stepBtn: { padding: 6, paddingHorizontal: 10 },
  qtyValue: { minWidth: 26, textAlign: 'center', fontWeight: '700', color: colors.gray900 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.gray900, marginTop: 20, marginBottom: 8 },
  segment: { flexDirection: 'row', gap: 10 },
  segmentBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  segmentActive: { borderColor: colors.navy900, backgroundColor: colors.navy50 },
  segmentText: { color: colors.gray600, fontWeight: '600', fontSize: 12 },
  segmentTextActive: { color: colors.navy900 },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  radioLabel: { fontSize: 15, color: colors.gray900 },
  payBox: {
    backgroundColor: colors.navy50,
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    gap: 10,
  },
  payHint: { color: colors.gray600, fontSize: 13, lineHeight: 18 },
  payPhone: { color: colors.navy900, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.gray900,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
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
  checkoutBtn: {
    backgroundColor: colors.navy900,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  checkoutText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  primaryBtn: {
    backgroundColor: colors.navy900,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
