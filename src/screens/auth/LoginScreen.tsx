import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { GOOGLE_WEB_CLIENT_ID } from '../../lib/supabase';
import { sendPhoneOtp, signInWithEmail, verifyPhoneOtp } from '../../data/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
type Mode = 'phone' | 'email';

export default function LoginScreen({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // phone
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');

  // email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const goToApp = () => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError('Enter your phone number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPhoneOtp(phone.trim());
      setOtpSent(true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (code.trim().length < 4) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyPhoneOtp(phone.trim(), code.trim());
      goToApp();
    } catch (e: any) {
      setError(e?.message ?? 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim(), password);
      goToApp();
    } catch (e: any) {
      setError(e?.message ?? 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Ionicons name="storefront" size={56} color={colors.navy900} />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account to continue shopping</Text>

        <View style={styles.tabs}>
          {(['phone', 'email'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.tab, mode === m && styles.tabActive]}
              onPress={() => {
                setMode(m);
                setError(null);
              }}
            >
              <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                {m === 'phone' ? 'Phone' : 'Email'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {mode === 'phone' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="01712345678"
              placeholderTextColor={colors.gray600}
              keyboardType="phone-pad"
              value={phone}
              editable={!otpSent}
              onChangeText={setPhone}
            />
            {otpSent && (
              <>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
                  placeholderTextColor={colors.gray600}
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={setCode}
                />
              </>
            )}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={otpSent ? handleVerifyOtp : handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>{otpSent ? 'Verify & Sign In' : 'Send OTP'}</Text>
              )}
            </TouchableOpacity>
            {otpSent && (
              <TouchableOpacity onPress={() => setOtpSent(false)}>
                <Text style={styles.link}>Change number</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.gray600}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.gray600}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleEmailLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {GOOGLE_WEB_CLIENT_ID.length > 0 && (
          <TouchableOpacity style={styles.googleBtn} disabled={loading}>
            <Ionicons name="logo-google" size={18} color={colors.gray900} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>
        )}

        <View style={styles.registerRow}>
          <Text style={styles.muted}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingTop: 56, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.navy900, marginTop: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  tabs: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: colors.gray100,
    borderRadius: 10,
    padding: 4,
    width: '100%',
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface },
  tabText: { color: colors.gray600, fontWeight: '600' },
  tabTextActive: { color: colors.navy900 },
  error: { color: colors.destructive, marginTop: 12, textAlign: 'center' },
  form: { width: '100%', marginTop: 20, gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray900, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.gray900,
  },
  primaryBtn: {
    backgroundColor: colors.navy900,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 13,
    width: '100%',
    marginTop: 16,
    backgroundColor: colors.surface,
  },
  googleBtnText: { color: colors.gray900, fontWeight: '600' },
  registerRow: { flexDirection: 'row', marginTop: 24 },
  muted: { color: colors.textMuted },
  link: { color: colors.orange500, fontWeight: '700' },
});
