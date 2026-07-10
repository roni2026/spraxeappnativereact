import { supabase } from '../lib/supabase';
import { Profile } from '../types/models';

/** Normalize a Bangladeshi number to E.164 (+880...), matching the website/original app. */
function normalizePhone(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, '');
  return raw.startsWith('+88') ? raw : `+88${digitsOnly}`;
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
}

/** Exchange a Google ID token for a Supabase session (only used when Google is configured). */
export async function signInWithGoogleIdToken(idToken: string): Promise<void> {
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw error;
}

/** Send a 6-digit SMS OTP to a local Bangladeshi number (e.g. 01712345678). */
export async function sendPhoneOtp(localPhoneNumber: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizePhone(localPhoneNumber),
  });
  if (error) throw error;
}

/** Verify the 6-digit SMS OTP code. */
export async function verifyPhoneOtp(localPhoneNumber: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    phone: normalizePhone(localPhoneNumber),
    token: code,
    type: 'sms',
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Fetch the profile row for the signed-in user, creating a default one if none exists. */
export async function fetchOrCreateProfile(
  fullName?: string | null,
  email?: string | null,
): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existing) return existing as Profile;

  const created: Profile = {
    id: userId,
    full_name: fullName ?? null,
    email: email ?? null,
    role: 'customer',
  };
  const { error } = await supabase.from('profiles').insert(created);
  if (error) throw error;
  return created;
}

export async function updateProfile(profile: Profile): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    })
    .eq('id', profile.id);
  if (error) throw error;
}

/** Push notifications are stubbed in Expo Go — kept as a no-op so callers stay unchanged. */
export async function saveFcmToken(_token: string): Promise<void> {
  // No FCM in Expo Go. Wire up expo-notifications in a custom build to enable this.
}

export async function syncFcmToken(): Promise<void> {
  // No-op stub (see saveFcmToken).
}
