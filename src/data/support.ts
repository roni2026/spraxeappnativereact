import { supabase } from '../lib/supabase';
import { getCurrentUserId } from './auth';

/** Support request types (mirrors the website's Support Center + support_tickets CHECK). */
export const SUPPORT_TYPES = [
  { value: 'inquiry', label: 'General Inquiry' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'refund', label: 'Refund Request' },
  { value: 'issue', label: 'Technical Issue' },
] as const;

export type SupportType = (typeof SUPPORT_TYPES)[number]['value'];

/** Static contact details shown on the Support screen (same as the website). */
export const SUPPORT_CONTACT = {
  email: 'spraxcare@gmail.com',
  phone: '09638-371951',
  liveChatHours: '8 AM – 11 PM',
};

export interface NewSupportTicket {
  email: string;
  type: SupportType;
  subject: string;
  message: string;
}

export interface SupportTicketRow {
  id: string;
  ticket_number: string | null;
  email: string | null;
  type: string | null;
  subject: string;
  message: string;
  status: string;
  priority: string | null;
  created_at: string | null;
}

/**
 * Create a support ticket. Works for both signed-in users and guests.
 * For guests, user_id is left null and the email field is used for contact.
 * Returns the generated ticket number on success.
 */
export async function createSupportTicket(input: NewSupportTicket): Promise<string> {
  let userId: string | null = null;
  try {
    userId = await getCurrentUserId();
  } catch {
    // Guest user — proceed without user_id
  }

  const ticketNumber = `TICKET-${Date.now()}`;
  const { error } = await supabase.from('support_tickets').insert({
    user_id: userId,
    ticket_number: ticketNumber,
    email: input.email.trim(),
    type: input.type,
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: 'open',
    priority: 'medium',
  });
  if (error) throw error;
  return ticketNumber;
}

/** List support tickets for the signed-in user (most recent first). */
export async function listMySupportTickets(): Promise<SupportTicketRow[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('support_tickets')
    .select('id, ticket_number, email, type, subject, message, status, priority, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []) as SupportTicketRow[];
}
