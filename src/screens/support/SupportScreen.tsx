import React, { useCallback, useEffect, useState } from 'react';
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
  FlatList,
  RefreshControl,
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
  SupportTicketRow,
  createSupportTicket,
  listMySupportTickets,
} from '../../data/support';
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<string, string> = {
  open: colors.orange500,
  pending: '#F59E0B',
  resolved: colors.success,
  closed: colors.gray600,
};

export default function SupportScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { userId, isAnonymous, profile } = useAuth();

  const [type, setType] = useState<SupportType>('inquiry');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTickets, setShowTickets] = useState(false);

  useEffect(() => {
    if (profile?.email) setEmail(profile.email);
  }, [profile?.email]);

  const loadTickets = useCallback(async (isRefresh = false) => {
    if (!userId || isAnonymous) return;
    if (isRefresh) setRefreshing(true);
    else setTicketsLoading(true);
    try {
      const list = await listMySupportTickets();
      setTickets(list);
    } catch {
      // ignore
    } finally {
      setTicketsLoading(false);
      setRefreshing(false);
    }
  }, [userId, isAnonymous]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

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
      // Refresh ticket list
      loadTickets();
    } catch (e: any) {
      Alert.alert('Submission failed', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTicket = ({ item }: { item: SupportTicketRow }) => {
    const statusColor = STATUS_COLORS[item.status] ?? colors.gray600;
    const dateStr = item.created_at
      ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
    return (
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketNumber}>{item.ticket_number ?? 'Ticket'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.ticketSubject} numberOfLines={2}>{item.subject}</Text>
        <Text style={styles.ticketMessage} numberOfLines={2}>{item.message}</Text>
        <View style={styles.ticketFooter}>
          <Text style={styles.ticketType}>{item.type}</Text>
          <Text style={styles.ticketDate}>{dateStr}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={
        userId && !isAnonymous
          ? <RefreshControl refreshing={refreshing} onRefresh={() => loadTickets(true)} />
          : undefined
      }
    >
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

      {/* My Tickets section (signed-in users only) */}
      {userId && !isAnonymous && (
        <View style={styles.ticketsSection}>
          <TouchableOpacity
            style={styles.ticketsToggle}
            onPress={() => setShowTickets((v) => !v)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="ticket-outline" size={20} color={colors.navy900} />
              <Text style={styles.ticketsToggleText}>My Support Tickets</Text>
              {tickets.length > 0 && (
                <View style={styles.ticketCountBadge}>
                  <Text style={styles.ticketCountText}>{tickets.length}</Text>
                </View>
              )}
            </View>
            <Ionicons name={showTickets ? 'chevron-up' : 'chevron-down'} size={20} color={colors.gray600} />
          </TouchableOpacity>

          {showTickets && (
            ticketsLoading ? (
              <View style={styles.ticketsLoading}>
                <ActivityIndicator color={colors.navy900} size="small" />
              </View>
            ) : tickets.length === 0 ? (
              <View style={styles.ticketsEmpty}>
                <Ionicons name="document-text-outline" size={36} color={colors.gray300} />
                <Text style={styles.ticketsEmptyText}>No tickets yet. Submit one below!</Text>
              </View>
            ) : (
              <FlatList
                data={tickets}
                keyExtractor={(item) => item.id}
                renderItem={renderTicket}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
            )
          )}
        </View>
      )}

      {/* Ticket form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Submit a Support Ticket</Text>
        <Text style={styles.formHint}>
          {userId && !isAnonymous
            ? 'Please provide accurate details so we can assist you faster.'
            : 'Enter your email so we can get back to you. No account needed!'}
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
  // Tickets section
  ticketsSection: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  ticketsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketsToggleText: { fontSize: 16, fontWeight: '700', color: colors.gray900 },
  ticketCountBadge: {
    backgroundColor: colors.navy900,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCountText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  ticketsLoading: { paddingVertical: 20, alignItems: 'center' },
  ticketsEmpty: { paddingVertical: 20, alignItems: 'center', gap: 8 },
  ticketsEmptyText: { color: colors.textMuted, fontSize: 13 },
  ticketCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketNumber: { fontSize: 13, fontWeight: '700', color: colors.navy900 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  ticketSubject: { fontSize: 14, fontWeight: '600', color: colors.gray900, marginBottom: 4 },
  ticketMessage: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketType: { fontSize: 11, color: colors.gray600, textTransform: 'capitalize' },
  ticketDate: { fontSize: 11, color: colors.gray600 },
  // Form
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
