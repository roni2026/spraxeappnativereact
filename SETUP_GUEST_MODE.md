# Spraxe App — Guest Mode & API Key Setup

This app now **opens straight to the Home screen** — customers can browse and
place orders **without logging in**. They just fill in their name / phone /
address at checkout in the cart. Logging in is optional (from the Profile tab)
and only useful for syncing orders across devices.

To make this work you need to do **two quick, one-time things** in Supabase.
Follow them in order.

---

## 1. Add your Supabase anon (public) key — fixes the "Invalid API key" error

The app couldn't talk to the backend because the public API key was missing.
There is **no `.env` file in the download** (that's normal — it's intentionally
excluded from Git), so the easiest place to put the key is directly in the code.

1. Go to **Supabase Dashboard → your project → Project Settings → API**.
2. Under **Project API keys**, copy the key labelled **`anon` / `public`**.
   It's a long token that starts with `eyJ...`.
3. Open the file **`src/lib/supabase.ts`** in the project.
4. Find this line near the top:

   ```ts
   const FALLBACK_SUPABASE_ANON_KEY = '';
   ```

   Paste your key between the quotes:

   ```ts
   const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOi...your-full-anon-key...';
   ```

5. Save the file.

> ⚠️ **Very important:** paste the **anon / public** key — **NOT** the
> `service_role` key. The `service_role` key is a secret admin key and must
> **never** be placed inside a mobile app. The `anon` key is designed to be
> public and safe to ship; your data stays protected by Supabase Row Level
> Security.

That's the "role key" you were looking for — it goes in `src/lib/supabase.ts`.

*(Advanced/optional: instead of pasting in the file you can create a `.env`
file in the project root with `EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...`, and add
the same value to each build profile's `env` block in `eas.json`. If set, the
env value takes priority. Pasting in `supabase.ts` is the simplest and works
everywhere.)*

---

## 2. Turn on anonymous sign-ins — makes guest checkout work

Ordering without an account uses Supabase **anonymous sign-in** (each guest
silently gets a hidden user id, so the cart and orders keep working). You must
enable it once:

1. Go to **Supabase Dashboard → Authentication → Sign In / Providers**
   (in some projects it's **Authentication → Settings**).
2. Find **"Allow anonymous sign-ins"** and turn it **ON**. Save.

If this is left off, the app still opens without a login screen, but adding to
cart / placing an order will fail because there's no session.

---

## 3. Run / rebuild the app

- **Expo Go (quick test):** `npm install` then `npx expo start`.
- **Standalone build (APK/iOS):** rebuild with EAS so the key is embedded:
  `eas build --profile preview --platform android` (or `production`).

After these steps the app opens directly on Home, no login is asked, and
customers can add to cart and check out as guests by entering their info in the
cart.

---

## What changed in the code (for reference)

- `src/context/AuthContext.tsx` — creates a silent anonymous "guest" session on
  launch (and again after logout) so login is never required.
- `src/screens/SplashScreen.tsx` — always routes to the Home tabs; the Login
  screen is no longer shown on startup.
- `src/lib/supabase.ts` — added a clearly-marked slot to paste your anon key.
- `src/screens/profile/AccountScreen.tsx` — guests see an optional "Log in"
  button instead of a forced login; logging out returns to guest mode.
