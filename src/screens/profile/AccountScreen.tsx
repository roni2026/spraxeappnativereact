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
import { useAuth } from '../../context/AuthContext';
import { signOut, updateProfile } from '../../data/auth';
import { Profile } from '../../types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AccountScreen() {
  const navigation = useNavigation<Nav>();
  const { userId, profile, refreshProfile } = useAuth();

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

  if (!userId) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-circle-outline" size={64} color={colors.gray600} />
        <Text style={styles.emptyTitle}>Sign in to manage your account</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </TouchableOpacity>
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
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } finally {
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.avatarWrap}>
        <Ionicons name="person-circle" size={72} color={colors.navy900} />
        <Text style={styles.name}>{profile?.full_name || 'Your Account'}</Text>
        {profile?.email ? <Text style={styles.email}>{profile.email}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Profile</Text>
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Your name"
        placeholderTextColor={colors.gray600}
      />
      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="01712345678"
        placeholderTextColor={colors.gray600}
        keyboardType="phone-pad"
      />
      <Text style={styles.label}>Address</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={address}
        onChangeText={setAddress}
        placeholder="Your shipping address"
        placeholderTextColor={colors.gray600}
        multiline
      />
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Shortcuts</Text>
      <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Orders')}>
        <Ionicons name="receipt-outline" size={22} color={colors.navy900} />
        <Text style={styles.linkText}>My Orders</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Wishlist')}>
        <Ionicons name="heart-outline" size={22} color={colors.navy900} />
        <Text style={styles.linkText}>My Wishlist</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Support')}>
        <Ionicons name="headset-outline" size={22} color={colors.navy900} />
        <Text style={styles.linkText}>Help & Support</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.gray600} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        <Text style={styles.logoutText}>Log Out</Text>
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
