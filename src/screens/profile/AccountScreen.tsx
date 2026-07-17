import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import ScreenHeader from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { signOut, updateProfile } from '../../data/auth';
import { Profile } from '../../types/models';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../../components/LanguageToggle';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AccountScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { userId, isAnonymous, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setAddress(profile.address ?? '');
    }
  }, [profile]);

  // Guest (anonymous) users: no forced login. Show a friendly screen where
  // logging in / creating an account is optional, plus the usual shortcuts.
  if (!userId || isAnonymous) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title={t('profile.yourAccount')} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person-circle-outline" size={72} color={colors.navy900} />
          <Text style={styles.name}>{t('profile.yourAccount')}</Text>
          <Text style={styles.email}>
            You&apos;re shopping as a guest. You can browse and place orders without
            an account — log in only if you want to sync your orders across devices.
          </Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.saveBtnText}>{t('auth.signIn')}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t('profile.shortcuts')}</Text>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Orders')}>
          <Ionicons name="receipt-outline" size={22} color={colors.navy900} />
          <Text style={styles.linkText}>{t('profile.myOrders')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Support')}>
          <Ionicons name="headset-outline" size={22} color={colors.navy900} />
          <Text style={styles.linkText}>{t('profile.helpSupport')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Support')}>
          <Ionicons name="create-outline" size={22} color={colors.navy900} />
          <Text style={styles.linkText}>Create Support Ticket</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Wishlist')}>
          <Ionicons name="heart-outline" size={22} color={colors.navy900} />
          <Text style={styles.linkText}>{t('profile.myWishlist')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('TrackOrder')}>
          <Ionicons name="locate-outline" size={22} color={colors.navy900} />
          <Text style={styles.linkText}>Track order</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Compare')}>
          <Ionicons name="git-compare-outline" size={22} color={colors.navy900} />
          <Text style={styles.linkText}>Compare</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <LanguageToggle />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
    );
  }

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated: Profile = {
        ...profile,
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };
      await updateProfile(updated);
      await refreshProfile();
      Alert.alert(t('profile.saved'), t('profile.profileUpdated'));
    } catch (e: any) {
      Alert.alert(t('profile.error'), e?.message ?? t('profile.couldNotSaveProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t('profile.logoutTitle'), t('profile.logoutConfirm'), [
      { text: t('profile.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } finally {
            // Login is optional — after logging out, return to the app as a
            // guest (a new anonymous session is created automatically).
            navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title={t('profile.yourAccount')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
        <Ionicons name="person-circle" size={72} color={colors.navy900} />
        <Text style={styles.name}>{profile?.full_name || t('profile.yourAccount')}</Text>
        {profile?.email ? <Text style={styles.email}>{profile.email}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>{t('profile.profile')}</Text>
      <Text style={styles.label}>{t('auth.fullName')}</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder={t('auth.fullName')}
        placeholderTextColor={colors.gray600}
      />
      <Text style={styles.label}>{t('auth.phone')}</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="01712345678"
        placeholderTextColor={colors.gray600}
        keyboardType="phone-pad"
      />
      <Text style={styles.label}>{t('profile.address')}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={address}
        onChangeText={setAddress}
        placeholder={t('profile.address')}
        placeholderTextColor={colors.gray600}
        multiline
      />
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>{t('profile.saveChanges')}</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>{t('profile.shortcuts')}</Text>
      <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Orders')}>
        <Ionicons name="receipt-outline" size={22} color={colors.navy900} />
        <Text style={styles.linkText}>{t('profile.myOrders')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Wishlist')}>
        <Ionicons name="heart-outline" size={22} color={colors.navy900} />
        <Text style={styles.linkText}>{t('profile.myWishlist')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Support')}>
        <Ionicons name="headset-outline" size={22} color={colors.navy900} />
        <Text style={styles.linkText}>{t('profile.helpSupport')}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Support')}>
        <Ionicons name="create-outline" size={22} color={colors.navy900} />
        <Text style={styles.linkText}>Create Support Ticket</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('TrackOrder')}>
        <Ionicons name="locate-outline" size={22} color={colors.navy900} />
        <Text style={styles.linkText}>Track order</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Compare')}>
        <Ionicons name="git-compare-outline" size={22} color={colors.navy900} />
        <Text style={styles.linkText}>Compare</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
      </TouchableOpacity>

      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <LanguageToggle />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>
      <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
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
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 20, fontWeight: '800', color: colors.gray900, marginTop: 8 },
  email: { color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.gray900, marginTop: 20, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray900, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.gray900,
    marginTop: 6,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: colors.navy900,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: { color: colors.white, fontWeight: '700' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.gray900 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.destructive,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
  },
  logoutText: { color: colors.destructive, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: colors.navy900,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
