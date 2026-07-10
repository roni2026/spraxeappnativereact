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

/**
 * Create a support ticket for the signed-in user.
 * Faithfully mirrors the website's /support submission (support_tickets insert).
 * Returns the generated ticket number on success.
 */
export async function createSupportTicket(input: NewSupportTicket): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Please log in to submit a support ticket.');

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
