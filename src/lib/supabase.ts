import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://kybgrsqqvejbvjediowo.supabase.co';

// ┌───────────────────────────────────────────────────────────────────────────┐
// │  PASTE YOUR SUPABASE **ANON / PUBLIC** KEY BETWEEN THE QUOTES BELOW.        │
// │                                                                            │
// │  Where to get it:                                                          │
// │    Supabase Dashboard → your project → Project Settings → API →            │
// │    "Project API keys" → copy the key labelled **anon / public**            │
// │    (a long token that starts with "eyJ...").                               │
// │                                                                            │
// │  This is the PUBLIC key and is safe to ship inside the app.                │
// │  ⚠️  Do NOT paste the "service_role" (secret) key here — that key must     │
// │      NEVER be placed in a mobile/web client.                               │
// │                                                                            │
// │  (Advanced: instead of pasting here you may leave it blank and set         │
// │   EXPO_PUBLIC_SUPABASE_ANON_KEY in a .env file / EAS build env — that       │
// │   value takes priority when present.)                                      │
// └───────────────────────────────────────────────────────────────────────────┘
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Ymdyc3FxdmVqYnZqZWRpb3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTI2NTYsImV4cCI6MjA3OTg2ODY1Nn0.S84KlGfH1zrJNASh4EJ9KqSt0Q4UCv6nyiSKVzP2sy8';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY;

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

/** True when a real Supabase anon key is available (dev .env or build-time env). */
export const isSupabaseConfigured = SUPABASE_ANON_KEY.length > 0;

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Auth and data requests will fail ' +
      'until it is provided. Set it in your local .env (see .env.example) AND in each build ' +
      "profile's `env` block in eas.json (or as an EAS secret) so it is embedded in release builds.",
  );
}

// IMPORTANT — crash-on-launch fix:
// supabase-js throws `Error: supabaseKey is required.` synchronously inside createClient()
// when the key is empty. Because this module is imported at app startup (App.tsx ->
// AuthProvider -> supabase), a missing key would take the whole app down instantly on
// launch (the app opens then immediately closes). This happens in standalone/EAS builds
// where EXPO_PUBLIC_SUPABASE_ANON_KEY was not embedded, even though it works in Expo Go
// with a local .env.
//
// To guarantee the app always launches, we pass a harmless placeholder key when the real
// one is absent. The client is then constructed successfully; network calls fail softly
// and are handled by the app's existing try/catch and the top-level ErrorBoundary, instead
// of crashing the process before any UI renders.
const clientKey = isSupabaseConfigured ? SUPABASE_ANON_KEY : 'missing-anon-key';

export const supabase = createClient(SUPABASE_URL, clientKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
