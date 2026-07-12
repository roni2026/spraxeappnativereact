import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://kybgrsqqvejbvjediowo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

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
