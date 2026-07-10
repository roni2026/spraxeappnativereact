# Push Notifications — Setup Guide

This guide turns on order push notifications end‑to‑end:

- **Customers** get notified when their order status changes (confirmed → shipped → delivered, etc.).
- **Staff** (admin/moderator) get notified when a new order is placed.

Delivery uses the **Expo Push Service**. On Android, Expo delivers through Firebase Cloud
Messaging (FCM) using credentials you upload **once** to your Expo project. The customer
& support apps only register a device token; a **Supabase Edge Function** sends the pushes.

> 🔐 **Security — read this first**
> The Firebase **Admin SDK** JSON (`spraxe-71942-firebase-adminsdk-*.json`) is a secret
> private key. **Never commit it to any repo** and never paste it into the app code. It is
> only uploaded to Expo (step 3). Because it was shared over chat, consider **rotating it**
> in Firebase → Project settings → Service accounts → *Generate new private key* once setup works.

---

## What's already done in code

- Both apps register for push and save the device's Expo token to `profiles.fcm_token`
  (`src/lib/push.ts`, called on app start / after sign‑in).
- The sender lives at `spraxe-web/supabase/functions/notify-order-events/index.ts`.

You now need to do the one‑time configuration below. Nothing here requires editing code.

---

## 1. Register the Android apps in Firebase

You need a **`google-services.json`** for each app (this is the *client* config — different
from the admin key, and safe to keep locally).

1. Firebase console → your project **spraxe-71942** → **Project settings** → **Your apps**.
2. Add an **Android** app for each package name:
   - Customer app: `com.spraxe.app`
   - Support app: `com.spraxe.support`
3. Download each **`google-services.json`** and place it in that app's repo root.
4. In each app's `app.json`, add this line inside the `"android"` block:
   ```json
   "android": {
     "package": "com.spraxe.app",
     "googleServicesFile": "./google-services.json",
     ...
   }
   ```
   > Add `google-services.json` to `.gitignore` if you prefer not to commit it.

## 2. Create an Expo project (EAS) for each app

Push tokens require an EAS `projectId` and a real build (remote push does **not** work in Expo Go).

```bash
npm install -g eas-cli
eas login                 # create a free Expo account if needed
cd spraxeappnativereact   # then repeat in spraxesupportappnativereact
eas init                  # writes extra.eas.projectId into app.json
```

## 3. Upload the Firebase key to Expo (this is where the admin key goes)

```bash
eas credentials
# choose: Android  ->  (your build profile)  ->  Push Notifications: FCM V1
# ->  Upload a service account key  ->  select the firebase-adminsdk-*.json file
```

This lets Expo deliver to Android via FCM. The key stays in Expo's secure store — **not in git**.

## 4. Build a dev/production build and install it on a phone

```bash
eas build -p android --profile development   # or --profile production
```

Install the resulting build on a **physical Android device** and sign in. On first launch it
asks for notification permission and saves the token to `profiles.fcm_token`.

## 5. Deploy the Edge Function (the sender)

From the `spraxe-web` repo:

```bash
supabase functions deploy notify-order-events
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to the function automatically.

## 6. Fire the function on order changes (Database Webhook)

Supabase dashboard → **Database** → **Webhooks** → **Create a new hook**:

- **Table:** `orders`
- **Events:** ✅ Insert  ✅ Update
- **Type:** Supabase Edge Function → `notify-order-events`
- **HTTP Headers:** add `Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>`
  (or deploy with `supabase functions deploy notify-order-events --no-verify-jwt`)

That's it. Now:

- Changing an order's status in the Support app or web admin → the customer gets a push.
- A customer placing an order → staff get a push.

---

## Troubleshooting

- **No token saved / `No EAS projectId` warning** → you skipped `eas init` (step 2) or are
  running in Expo Go. Use a dev/production build on a real device.
- **Token saved but no push arrives** → confirm the FCM key upload (step 3) and that a
  Database Webhook exists (step 6). Test the function from the Supabase dashboard logs.
- **iOS** → the same code works; upload an APNs key via `eas credentials` (iOS) instead of FCM.
