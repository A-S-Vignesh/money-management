# Money Nest — Mobile

Expo SDK 55 app for Android (and iOS, when you're on a Mac).

Shares Zod schemas + types with the Next.js web app via `@money-nest/shared`.
Auth uses native Google Sign-In → exchanges the ID token for a Money Nest
JWT (stored in expo-secure-store) → `Authorization: Bearer` on every API call.

---

## Prerequisites

1. **Node 22+** and **pnpm 10+** (the repo is a pnpm workspace).
2. **Android Studio** with an emulator OR a real Android phone with USB debugging.
3. A **Google Cloud OAuth client** — see _Google OAuth setup_ below.

---

## First-time setup

From the repo root:

```bash
pnpm install        # installs web + mobile + shared
```

Create `mobile/.env` with the values the app needs at runtime:

```env
# Where the JSON API lives (dashboard, transactions, etc.).
#   - Android emulator → http://10.0.2.2:3000   (special host alias)
#   - Real device      → http://<your-laptop-LAN-IP>:3000   (NOT localhost)
#   - Production       → https://moneynestapp.vercel.app
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000

# Where the OAuth relay lives. MUST be HTTPS — Google won't accept anything
# else on Web OAuth clients. Always your prod Vercel URL, even in dev.
# (The OAuth flow only runs once at sign-in, so it's fine that it bypasses
# your local dev backend.)
EXPO_PUBLIC_AUTH_BASE_URL=https://moneynestapp.vercel.app
```

`EXPO_PUBLIC_*` env vars are baked into the bundle at build time; restart
Metro with `pnpm start --clear` after editing this file.

---

## Run — works in Expo Go

Auth uses `expo-auth-session` (browser-based OAuth) instead of the native
Google Sign-In SDK, so the app boots cleanly inside Expo Go. SecureStore
and Notifications also degrade gracefully in Expo Go.

```bash
# Make sure your laptop and phone are on the same Wi-Fi network.
cd mobile
pnpm start            # Metro opens with a QR code
# Scan the QR with Expo Go on Android.
```

If your phone and laptop can't see each other on the LAN (corporate Wi-Fi,
hotel networks, etc.), use the tunnel mode:

```bash
pnpm start:tunnel     # routes through ngrok — slower but works anywhere
```

### EAS cloud builds (when you outgrow Expo Go)

When you eventually need native modules Expo Go can't load (deep links,
in-app purchases, the native Google Sign-In sheet), switch to a dev build:

```bash
npm install -g eas-cli
eas login
pnpm build:dev:android      # cloud-build a debug APK, ~10–15 min
```

EAS prints a QR / download URL when done. Install on the phone, then
`pnpm start` connects automatically.

### Cache busting

If you change `app.config.ts`, `babel.config.js`, `metro.config.js`, or
`tailwind.config.js`, restart Metro with `--clear`:

```bash
pnpm start --clear
```

---

## Google OAuth setup

The mobile app does NOT talk to Google directly. It routes through the
deployed Vercel backend's `/api/auth/mobile/start` → `/callback` relay
because Google's Web OAuth client refuses non-HTTPS redirect URIs (so
`exp://` deep links and LAN IPs are not allowed). Architecture:

```
Mobile  ─openAuthSessionAsync─►  vercel/api/auth/mobile/start
                                            │
                                            ▼  302
                                       Google sign-in
                                            │
                                            ▼  302 with code
                                  vercel/api/auth/mobile/callback
                                            │  (exchanges code, mints JWT)
                                            ▼  HTML bouncer to exp:// or moneynest://
Mobile  ◄────── token + user delivered as URL query params ──────────
```

What you need to do **once** in Google Cloud Console:

1. Open [Google Cloud Console](https://console.cloud.google.com) → APIs &
   Services → Credentials → your existing **Web application** OAuth client
   (the same one NextAuth uses for web sign-in).
2. Under **Authorized redirect URIs**, add **just one**:

   ```
   https://moneynestapp.vercel.app/api/auth/mobile/callback
   ```

   (Replace with your actual Vercel URL if different.)
3. Click **Save** — changes can take ~1 minute to propagate.
4. The same Web client ID is used by NextAuth and the mobile relay, so
   mobile and web sign-ins resolve to the same user record automatically.

No separate Android or iOS client ID is needed. No client secret in the
mobile app. The secret stays server-side, used only by the Vercel callback
during the code exchange.

---

## How auth flows

```
Mobile app
   │  GoogleSignin.signIn()         (native Android SDK)
   ▼
Google → returns idToken (audience = web client ID)
   │
   │  POST /api/auth/mobile/google { idToken }
   ▼
Next.js backend
   │  verifyGoogleIdToken()         (Google tokeninfo endpoint)
   │  findOrCreateUser()            (bootstraps Main Wallet + Deleted Account)
   │  signMobileJwt({ sub, email }) (HS256, NEXTAUTH_SECRET)
   ▼
   { token, user }
   │
   ▼
Mobile app stores JWT in SecureStore.
Every subsequent request: Authorization: Bearer <jwt>.
Backend's getUserId(req) accepts NextAuth session OR Bearer JWT.
```

---

## Project layout

```
mobile/
├── app.config.ts          → Expo config (plugins, extra env, Google plugin)
├── babel.config.js        → babel-preset-expo + nativewind/babel
├── metro.config.js        → monorepo paths + NativeWind transform
├── tailwind.config.js     → Tailwind v3.4 (NativeWind 4 needs v3, NOT v4)
├── src/
│   ├── app/               → Expo Router file-based routes
│   │   ├── _layout.tsx           → root: providers, hydration gate, Stack
│   │   ├── index.tsx             → auth gate (redirect)
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   └── login.tsx         → Google Sign-In screen
│   │   └── (tabs)/
│   │       ├── _layout.tsx       → <NativeTabs> (iOS Liquid Glass + Material 3)
│   │       ├── index.tsx         → Dashboard (live, wired to /api/dashboard)
│   │       ├── transactions.tsx  → placeholder
│   │       ├── budgets.tsx       → placeholder
│   │       ├── investments.tsx   → placeholder
│   │       └── profile.tsx       → theme picker + sign out
│   ├── lib/
│   │   ├── api.ts         → fetch wrapper, attaches Bearer, unwraps envelope
│   │   ├── auth.ts        → Zustand auth store, SecureStore-backed
│   │   ├── theme.ts       → light/dark/system store, AsyncStorage-backed
│   │   ├── queryClient.ts → TanStack Query client (same defaults as web)
│   │   └── format.ts      → currency formatter
│   ├── components/        → SDK 55 starter components (themed-text etc.) +
│   │                        custom (Placeholder.tsx)
│   ├── constants/         → SDK 55 starter Colors / Spacing / Fonts
│   └── hooks/             → SDK 55 starter color-scheme helpers
```

---

## What's done in this milestone

- ✅ Monorepo (pnpm workspaces): `mobile/`, `shared/`, web stays at root
- ✅ Shared Zod schemas (`@money-nest/shared`) — transaction, budget, goal,
       category palettes, API envelope types
- ✅ Backend mobile auth endpoint + unified `getUserId(req)` helper
- ✅ Dashboard route accepts both NextAuth and Bearer JWT
- ✅ NativeWind 4 + Tailwind v3.4 wired up (dark mode via class)
- ✅ Auth gate, theme provider, hydration handshake, SecureStore
- ✅ Login screen (Google Sign-In)
- ✅ Tabs (`NativeTabs` — true native styling)
- ✅ Dashboard screen wired to `/api/dashboard`
- ✅ Profile screen with theme picker + sign-out

## What's next (per-screen, ~1 session each)

- Transactions list + add/edit modal + SMS-paste import
- Budgets list + progress
- Investments + Holdings
- Reports charts (via `react-native-gifted-charts` or `victory-native`)
- Notifications screen + push registration (`expo-notifications`)
- Pull other API routes through `getUserId` (currently only `/api/dashboard`)

---

## Common issues

**`Cannot find module '@money-nest/shared'`**
You're not running from the workspace root; or `pnpm install` wasn't run.
Re-run `pnpm install` at the repo root.

**Tailwind classes don't apply**
NativeWind 4 needs **Tailwind v3.4.x**. Don't upgrade to v4 — it's not
supported by NativeWind yet. The lint warnings about `@tailwind base` being
"deprecated" come from your editor's v4-aware linter and are wrong here.

**Google Sign-In fails with `DEVELOPER_ERROR`**
The Android OAuth client's SHA-1 doesn't match your debug keystore. Run the
keytool command in _Google OAuth setup_ and re-add the fingerprint in the
Cloud Console credential.
