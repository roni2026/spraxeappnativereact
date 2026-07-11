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
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
type Mode = 'phone' | 'email';

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
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
      setError(t('auth.enterPhone'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPhoneOtp(phone.trim());
      setOtpSent(true);
    } catch (e: any) {
      setError(e?.message ?? t('auth.failedToSendOtp'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (code.trim().length < 4) {
      setError(t('auth.enterCode'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyPhoneOtp(phone.trim(), code.trim());
      goToApp();
    } catch (e: any) {
      setError(e?.message ?? t('auth.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      setError(t('auth.enterEmailPassword'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim(), password);
      goToApp();
    } catch (e: any) {
      setError(e?.message ?? t('auth.signInFailed'));
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
        <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
        <Text style={styles.subtitle}>{t('auth.welcomeBackSubtitle')}</Text>

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
                {m === 'phone' ? t('auth.phone') : t('auth.email')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {mode === 'phone' ? (
          <View style={styles.form}>
            <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
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
                <Text style={styles.label}>{t('auth.verificationCode')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.enterCode')}
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
                <Text style={styles.primaryBtnText}>{otpSent ? t('auth.verifyAndSignIn') : t('auth.sendOtp')}</Text>
              )}
            </TouchableOpacity>
            {otpSent && (
              <TouchableOpacity onPress={() => setOtpSent(false)}>
                <Text style={styles.link}>{t('auth.changeNumber')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.gray600}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Text style={styles.label}>{t('auth.password')}</Text>
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
                <Text style={styles.primaryBtnText}>{t('auth.signIn')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {GOOGLE_WEB_CLIENT_ID.length > 0 && (
          <TouchableOpacity style={styles.googleBtn} disabled={loading}>
            <Ionicons name="logo-google" size={18} color={colors.gray900} />
            <Text style={styles.googleBtnText}>{t('auth.continueWithGoogle')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.registerRow}>
          <Text style={styles.muted}>{t('auth.dontHaveAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>{t('auth.register')}</Text>
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
