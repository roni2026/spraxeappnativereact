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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import {
  SUPPORT_TYPES,
  SUPPORT_CONTACT,
  SupportType,
  createSupportTicket,
} from '../../data/support';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SupportScreen() {
  const navigation = useNavigation<Nav>();
  const { userId, profile } = useAuth();

  const [type, setType] = useState<SupportType>('inquiry');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.email) setEmail(profile.email);
  }, [profile?.email]);

  if (!userId) {
    return (
      <View style={styles.center}>
        <Ionicons name="chatbubbles-outline" size={64} color={colors.gray600} />
        <Text style={styles.emptyTitle}>Sign in to contact support</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing details', 'Please add a subject and a message.');
      return;
    }
    setLoading(true);
    try {
      const ticketNumber = await createSupportTicket({ email, type, subject, message });
      Alert.alert(
        'Ticket submitted 🎉',
        `Your ticket ${ticketNumber} has been created. Our team will get back to you soon.`,
      );
      setSubject('');
      setMessage('');
      setType('inquiry');
    } catch (e: any) {
      Alert.alert('Submission failed', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Support Center</Text>
      <Text style={styles.subtitle}>Need help? Our team is ready to assist you.</Text>

      {/* Contact cards */}
      <View style={styles.cardsRow}>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_CONTACT.email}`)}
        >
          <Ionicons name="mail-outline" size={22} color={colors.navy900} />
          <Text style={styles.contactTitle}>Email</Text>
          <Text style={styles.contactValue}>{SUPPORT_CONTACT.email}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL(`tel:${SUPPORT_CONTACT.phone}`)}
        >
          <Ionicons name="call-outline" size={22} color={colors.navy900} />
          <Text style={styles.contactTitle}>Phone</Text>
          <Text style={styles.contactValue}>{SUPPORT_CONTACT.phone}</Text>
        </TouchableOpacity>
        <View style={styles.contactCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.navy900} />
          <Text style={styles.contactTitle}>Live Chat</Text>
          <Text style={styles.contactValue}>{SUPPORT_CONTACT.liveChatHours}</Text>
        </View>
      </View>

      {/* Ticket form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Submit a Support Ticket</Text>
        <Text style={styles.formHint}>
          Please provide accurate details so we can assist you faster.
        </Text>

        <Text style={styles.label}>Request Type</Text>
        <View style={styles.chipsRow}>
          {SUPPORT_TYPES.map((t) => {
            const active = t.value === type;
            return (
              <TouchableOpacity
                key={t.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setType(t.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.gray600}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Brief summary of your issue"
          placeholderTextColor={colors.gray600}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue or question in detail"
          placeholderTextColor={colors.gray600}
          multiline
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Submit Ticket</Text>
          )}
        </TouchableOpacity>
      </View>
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
  title: { fontSize: 24, fontWeight: '800', color: colors.gray900 },
  subtitle: { color: colors.textMuted, marginTop: 4, marginBottom: 16 },
  cardsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  contactCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  contactTitle: { fontSize: 13, fontWeight: '700', color: colors.gray900 },
  contactValue: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
  },
  formTitle: { fontSize: 17, fontWeight: '700', color: colors.gray900 },
  formHint: { color: colors.textMuted, marginTop: 4, marginBottom: 8, fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray900, marginTop: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  chipText: { color: colors.gray900, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: colors.white },
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
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: colors.navy900,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: { color: colors.white, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: colors.navy900,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
});
