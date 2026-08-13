# Spraxe (React Native / Expo)

The Spraxe customer shopping app, rewritten from the original native Android app (Kotlin + Jetpack Compose) into a cross-platform React Native app built with Expo (managed workflow) and TypeScript. It talks to the same Supabase backend and follows the original app's screens and features closely.

## Features

- **Splash** — settles briefly, then routes to the shop if a session exists, otherwise to login
- **Auth** — phone (SMS OTP) or email + password login, plus registration. A Google sign-in button appears when `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is configured
- **Home** — hero banner carousel, category rail, Best Sellers, Featured Products, and a "Why Shop With Spraxe" feature grid
- **Categories** — live, searchable list
- **Products** — search + category filter, product grid, and a detail screen with images, price, quantity selector, add to cart, wishlist, and reviews (star rating, verified-purchase badge, write-a-review for delivered orders)
- **Cart** — server-persisted, delivery zone selection (Inside/Outside Dhaka → ৳60/৳120), payment method (Cash on Delivery / bKash / Nagad), checkout
- **Account** — profile edit, links to orders and wishlist, logout
- **Orders / Order Detail** — order history and a full breakdown with a status timeline
- **Wishlist** — saved items, add to cart or remove

Prices show in Bangladeshi Taka (৳). Bottom tabs: Home, Categories, Cart (with badge), Account.

## Setup

```bash
npm install
cp .env.example .env
# then set EXPO_PUBLIC_SUPABASE_ANON_KEY in .env
npx expo start
```

## Related

The original native Android build of this app is at [`spraxeapp-kotlin`](https://github.com/roni2026/spraxeapp-kotlin). The staff/admin counterpart is [`spraxesupportappnativereact`](https://github.com/roni2026/spraxesupportappnativereact).
