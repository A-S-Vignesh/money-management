# Money Nest — Mobile App Analysis

## App Overview

**Money Nest** is a personal finance management app built with:

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 55 (React Native 0.83) |
| Routing | expo-router (file-based, typed routes) |
| Styling | NativeWind 4 (TailwindCSS 3) + inline styles |
| State | Zustand (auth, security, drawer, transaction sheet) |
| Server state | TanStack React Query v5 |
| Forms | react-hook-form + Zod 4 |
| Charts | react-native-gifted-charts + custom SVG (Sparkline, Donut, LineChart, DualBars) |
| Auth | Google OAuth via expo-web-browser relay to Vercel backend |
| Storage | expo-secure-store (JWT), AsyncStorage (preferences) |
| Backend | Next.js API routes on Vercel (`moneynestapp.vercel.app`) |

---

## Current Functionality

### 🏠 1. Dashboard ([index.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/index.tsx))
- **Hero card** — total balance with gradient, eye-toggle to hide balance, sparkline of net flow
- **Quick actions** — Add expense, Send (transfer), Goals, Invest shortcuts
- **Income / Expense metric cards** — with month-over-month delta percentages
- **Spending breakdown** — interactive donut chart with top 5 categories
- **Goals carousel** — horizontal scroll of goal progress cards
- **Recent activity** — last 6 transactions with tap-to-view detail sheet

### 💳 2. Transactions ([transactions.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/transactions.tsx))
- Search with debounced query (350ms)
- Filter chips: All / Expenses / Income / Transfers
- Date-grouped list (Today / Yesterday / formatted date)
- Per-group daily net flow indicator
- Tap row → TxDetailSheet (view details)
- Edit handoff from detail sheet → AddTransactionSheet
- Add new via global FAB

### 📊 3. Reports ([reports.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/reports.tsx))
- Period selector: 1M / 3M / 6M / 1Y / ALL
- **Income vs Expense** dual bar chart with legend
- **Summary stats** — total in, total out, avg savings rate + comparison deltas vs previous period
- **Net worth trend** — cumulative line chart with X-axis labels
- **Highlights** — computed AI-like insights (top category, savings rate change, net flow direction)
- **Where it goes** — expense category breakdown with progress bars
- **Where it comes from** — income source breakdown
- Download button (placeholder)

### 💰 4. Budgets ([budgets.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/budgets.tsx))
- Hero card: total spent vs allocated, % used, gradient progress bar
- Over-budget alert pill (rose) when categories exceed limits
- Per-category rows: icon + name + spent/allocated + % + progress bar
- Status color coding: green (<70%), amber (70-90%), rose (≥100%)
- **Smart suggestion** — recommends increasing the most over-budget category's allocation
- Create/Edit via BudgetSheet bottom sheet

### 🎯 5. Goals ([goals.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/goals.tsx))
- "Total Saved" hero with combined progress bar
- Per-goal cards with category-specific icons (Emergency, Travel, House, Vehicle, Gadget, Gift, Education)
- Progress bar with gradient fill
- Deadline display, saved/target amounts, % complete
- "Add new goal" dashed card at bottom
- Detail page per goal ([goals/[id].tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/goals/[id].tsx))

### 📈 6. Investments ([investments.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/investments.tsx))
- Emerald gradient hero — portfolio value + unrealized P&L % and amount
- **Allocation donut** — by asset type (Stock, Mutual Fund, ETF, FD, Gold, PPF, Crypto, Real Estate)
- Holdings list with symbol monogram tile, quantity, current price, value, and % change
- Tap row → holding detail page ([holdings/[id].tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/holdings/[id].tsx))
- Add investment via bottom sheet

### 🏦 7. Accounts ([accounts.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/accounts.tsx))
- Total balance across all accounts
- Per-account cards: color-tinted icon (cash/card/wallet), name, balance, share-of-total bar
- Create/Edit via AccountSheet
- Account type icons: Banknote (cash), CreditCard (bank/credit), Wallet (other)

### 👤 8. Profile ([profile.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/profile.tsx))
- Header card: Google avatar (or gradient-initials fallback), name, email, PRO pill
- Stats row: Investments | Goals | Accounts counts
- Accounts mini-list
- Quick links: Settings, Notifications, Help & Support, Log out
- Edit profile via bottom sheet

### ⚙️ 9. Settings ([settings.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/settings.tsx))
- **Appearance** — Dark mode toggle (with smooth theme transition overlay), Currency (INR ₹), Date format
- **Notifications** — Push notifications (with OS permission flow), Email digests, Budget alerts, Investment updates
- **Security** — Biometric unlock (Face ID/Touch ID with hardware check), App lock timeout (cycling 0s–15min), Two-factor auth (TODO), Hide balance on open
- **Data** — Export data (TODO), Sync now, Delete account (TODO)
- **About** — Rate, Feedback, Terms & Privacy

### 🔔 10. Notifications ([notifications.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/notifications.tsx))
- Unread/read split with "New · N" section
- Time-bucketed read notifications (Today, Yesterday, This week, This month, Older)
- Type-specific icons and tones (budget, goal, transaction, system)
- Mark all read, mark individual, long-press to delete, clear all read
- Unread dot indicator on bell badge in TopHeader

### 🔐 11. Login ([login.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(auth)/login.tsx))
- Google OAuth sign-in via expo-web-browser
- JWT token stored in expo-secure-store

---

## Architecture Highlights

### Navigation
```
Root Layout (_layout.tsx)
├── (auth)/login — unauthenticated
└── (tabs)/_layout — authenticated shell
    ├── Slot (active screen)
    ├── GlobalFab (floating + button)
    ├── BottomTabBar (custom JS tab bar, not native)
    ├── Drawer (side navigation)
    └── AddTransactionSheet (global, driven by Zustand store)
```

### Security Layer ([security.ts](file:///d:/studying/Next/moneymanagement/mobile/src/lib/security.ts))
- Per-user preference persistence (keyed by Google user ID)
- Biometric unlock with hardware/enrollment checks
- App lock timeout cycling (Immediately → 15s → 30s → 1m → 5m → 15m)
- Background timestamp tracking for lock timeout calculation
- Balance visibility toggle (persisted + runtime state)
- Lock enforced on both cold-start and sign-in (closes "logout to skip lock" hole)

### UI Component Library (21 components in [components/ui/](file:///d:/studying/Next/moneymanagement/mobile/src/components/ui))
| Component | Purpose |
|-----------|---------|
| BottomSheet | Pan-gesture dismissible modal sheet |
| Card | Themed surface card |
| Chip | Filter/action pill |
| Donut | SVG donut chart |
| DualBars | Income/expense bar comparison chart |
| EmptyState | Empty data placeholder |
| IconTile | Color-tinted icon wrapper |
| LineChart | SVG line chart with gradient fill |
| MetricCard | Stat card with icon + delta |
| Money | Currency-formatted text |
| PeriodSelector | Time range chip group |
| Progress | Horizontal progress bar |
| ScreenHead | Screen title + subtitle + menu + trailing action |
| ScreenHeader | Simpler header variant |
| Section | Section title + action link |
| SectionCard | Bordered section card |
| Skeleton | Shimmer loading placeholder |
| Sparkline | Mini SVG line graph |
| TopHeader | Dashboard-specific header with bell + menu |
| TxRow | Transaction list row |
| Collapsible | Animated expand/collapse container |

---

## 🔧 Improvement Recommendations

### 🔴 Critical / High Impact

#### 1. Offline Support & Data Persistence
Currently, the app requires network connectivity for every action. Users can't view data offline.
- Add React Query persistence with `@tanstack/query-persist-client-core` + AsyncStorage
- Cache last-fetched dashboard, transactions, and budgets for offline viewing
- Queue mutations (add/edit transactions) for retry when back online

#### 2. Pagination & Infinite Scroll
[Transactions](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/transactions.tsx#L63-L68) fetches `limit: 100` all at once. This will degrade as data grows.
- Implement `useInfiniteQuery` with cursor-based pagination
- Add a `FlatList` with `onEndReached` for infinite scroll (currently uses `ScrollView`)
- Same applies to notifications and holdings lists

#### 3. Implement TODO Features
Several settings features are placeholders:
- **Two-factor auth** ([settings.tsx:265](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/settings.tsx#L265)) — `/* TODO: open 2FA setup */`
- **Export data** ([settings.tsx:291](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/settings.tsx#L291)) — `/* TODO: trigger CSV export */`
- **Sync now** ([settings.tsx:300](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/settings.tsx#L300)) — `/* TODO: trigger queryClient.invalidateQueries() */`
- **Delete account** ([settings.tsx:314](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/settings.tsx#L314)) — `/* TODO: confirm + DELETE /api/account/delete */`
- **Report download** ([reports.tsx:600](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/reports.tsx#L600)) — download button has no handler

#### 4. Error Handling & Recovery
- No visible `ErrorBoundary` integration on screens (component exists at [ErrorBoundary.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/components/ErrorBoundary.tsx) but isn't used per-screen)
- No toast/snackbar system for success/error feedback after mutations
- API failures silently fail — users don't know if a transaction save succeeded

---

### 🟡 UX & Polish

#### 5. Haptic Feedback
- Add `expo-haptics` for button presses, successful mutations, pull-to-refresh completion
- Especially valuable for: FAB tap, transaction save, budget threshold crosses

#### 6. Swipe-to-Delete on Transaction Rows
The transaction list only supports tap (view) and edit. Add:
- Swipe-left to reveal delete action (with haptic + confirmation)
- Swipe-right for quick categorize

#### 7. Currency & Locale Selection
Currency is hardcoded as INR ₹ in [settings.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/settings.tsx#L185). Make it selectable:
- Build a currency picker with the most common currencies
- Persist preference and propagate to `formatCurrency`

#### 8. Recurring Transactions
Users currently must manually add every transaction. Add:
- Recurring transaction templates (daily/weekly/monthly/yearly)
- Auto-creation or reminder notification when a recurring transaction is due

#### 9. Better Empty States
The empty states are text-only. Improve with:
- Illustrated empty state graphics (use `generate_image` or Lottie animations)
- Actionable CTA buttons embedded in the empty state cards

#### 10. Transaction Attachments
Allow users to attach receipt photos/documents to transactions:
- Use `expo-image-picker` for camera/gallery access
- Upload and link to backend

---

### 🟢 Performance

#### 11. Replace ScrollView with FlatList/FlashList
Several screens use `ScrollView` for lists:
- [Transactions](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/transactions.tsx#L122) — grouped items in ScrollView
- [Notifications](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/notifications.tsx#L161) — all notifications in ScrollView

Replace with `FlatList` or `@shopify/flash-list` for virtualization — critical once lists exceed ~50 items.

#### 12. Memoize Heavy Components
- The `DashboardGoalCard`, `BudgetRow`, and `HoldingRow` components re-render on every parent update
- Wrap with `React.memo` + stable callbacks via `useCallback`

#### 13. Image Caching
Profile images use `expo-image` (good ✅) — but verify that the content-fit and transition props are set optimally for caching.

---

### 🧪 Testing

#### 14. No Test Files Found
The mobile app has **zero test files**. Add:
- Unit tests for utility functions (`formatCurrency`, `lightenHex`, `tint`, `statusFor`)
- Component tests for key UI primitives (`Money`, `Donut`, `Skeleton`)
- Integration tests for authentication flow
- E2E tests with Detox or Maestro for critical user journeys

---

### 🏗️ Code Quality

#### 15. Deduplicate Color Utility Functions
The functions `tint()`, `lightenHex()`, and `lighten()` are **duplicated across 5+ files**:
- [accounts.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/accounts.tsx#L341)
- [investments.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/investments.tsx#L476)
- [reports.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/reports.tsx#L629)
- [goals.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/goals.tsx#L405)
- [profile.tsx](file:///d:/studying/Next/moneymanagement/mobile/src/app/(tabs)/profile.tsx#L545)

→ Extract to a shared `lib/colors.ts` utility.

#### 16. Extract Shared Screen Patterns
Every screen follows the same pattern: `SafeAreaView` → `ScreenHead` → `ScrollView` with `RefreshControl`. Extract a `ScreenShell` layout component.

#### 17. Type-Safe Route Navigation
Many routes use `as never` type assertions:
```typescript
router.push("/(tabs)/goals" as never)
router.push(`/goals/${g._id}` as never)
```
The app has `typedRoutes: true` in experiments — ensure route types are properly generated so you can drop the `as never` casts.

---

### 🔒 Security Enhancements

#### 18. Session Token Refresh
No visible token refresh mechanism. JWT tokens will expire and the user gets silently logged out.
- Implement a refresh token flow or silent re-authentication

#### 19. Certificate Pinning
For a finance app, add SSL certificate pinning to prevent MITM attacks in production.

#### 20. Sensitive Data Masking in Logs
Ensure `console.warn` calls in [security.ts](file:///d:/studying/Next/moneymanagement/mobile/src/lib/security.ts#L135) and elsewhere don't leak sensitive data in production builds.

---

### ♿ Accessibility

#### 21. Missing Accessibility Labels
Many interactive elements (icon buttons, pressables) lack `accessibilityLabel` and `accessibilityRole`:
- The eye-toggle on the hero card
- FAB button
- Drawer toggle
- Filter chips

#### 22. Contrast Ratios
Some muted text (`text-fg-muted`) at 10.5-11px may not meet WCAG AA contrast requirements, especially on the gradient hero cards.

#### 23. Screen Reader Navigation
- Add `accessibilityHint` to complex interactive elements
- Ensure bottom sheet modals trap focus properly

---

### 💡 Feature Ideas for V2

#### 24. Multi-Currency Support
Track accounts and transactions in different currencies with automatic conversion.

#### 25. Bill Reminders
Set reminders for upcoming bills (rent, subscriptions, EMIs) with push notifications.

#### 26. Debt Tracker
Track loans, credit card debt, and EMI schedules with payoff projections.

#### 27. Financial Insights / AI Assistant
Use the spending data to generate personalized financial advice:
- "You spent 40% more on dining this month"
- "At your current savings rate, you'll reach your Emergency Fund goal in 8 months"

#### 28. Widgets
Add home screen widgets (iOS/Android) showing balance, recent transactions, or budget status.

#### 29. Split Expenses
Track shared expenses with friends/family with settlement tracking.

#### 30. Custom Categories
Let users create their own transaction categories beyond the preset ones.

---

## Summary Score Card

| Area | Score | Notes |
|------|-------|-------|
| **Feature Completeness** | ⭐⭐⭐⭐ | Core money management features are comprehensive |
| **UI/UX Quality** | ⭐⭐⭐⭐⭐ | Excellent design — gradients, skeletons, dark mode, animations |
| **Code Architecture** | ⭐⭐⭐⭐ | Clean separation, Zustand + React Query, typed routes |
| **Security** | ⭐⭐⭐⭐ | Biometric lock, secure store, per-user prefs — missing 2FA & cert pinning |
| **Performance** | ⭐⭐⭐ | Needs FlatList virtualization and pagination |
| **Testing** | ⭐ | No tests found |
| **Accessibility** | ⭐⭐ | Missing labels, hints, and contrast checks |
| **Offline Support** | ⭐ | No offline capability |

> **Overall:** Your app is exceptionally well-designed with a polished, premium UI and a solid feature set. The biggest gaps are **testing, offline support, and pagination** — all of which are critical before scaling to a larger user base. The duplicated utility functions and TODO placeholders should be addressed in the near term.
