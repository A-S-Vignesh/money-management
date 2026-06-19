// src/app/(tabs)/_layout.tsx
//
// Was: NativeTabs (iOS Liquid Glass / Android Material 3).
// Now: Slot + custom JS-rendered tab bar so we match the Mobile UI mock's
// rounded blue-accented pill across both platforms.
//
// Bonus: this layout also hosts globals that should appear on every tab —
// the side Drawer, the GlobalFab, and the AddTransaction bottom sheet
// driven by useTransactionSheet store. Per-screen instances were removed.

import { Redirect, Slot } from "expo-router";
import {
  View,
} from "react-native";

import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";
import { useDateFormat } from "@/lib/dateFormat";
import { Tokens } from "@/lib/design";
import { useTransactionSheet } from "@/lib/stores";

import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { Drawer } from "@/components/nav/Drawer";
import { GlobalFab } from "@/components/nav/GlobalFab";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { useColorScheme } from "@/hooks/useAppColorScheme";

export default function TabsLayout() {
  const token = useAuth((s) => s.token);
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  const sheetOpen = useTransactionSheet((s) => s.open);
  const sheetEditing = useTransactionSheet((s) => s.editing);
  const sheetInitialType = useTransactionSheet((s) => s.initialType);
  const closeSheet = useTransactionSheet((s) => s.close);

  // Re-render the whole tabs tree whenever the user changes their
  // display currency or date format in Settings. `formatCurrency` and
  // `formatDate` read the underlying stores non-reactively (via
  // getState), so without these subscriptions the active screen would
  // keep showing the old symbol/locale or date shape until the next
  // unrelated re-render.
  useCurrency((s) => s.code);
  useDateFormat((s) => s.code);

  if (!token) return <Redirect href="/(auth)/login" />;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: dark ? Tokens.bgDark : Tokens.bg,
      }}
    >
      {/* Active screen */}
      <Slot />

      {/* Persistent UI on every tab */}
      <GlobalFab />
      <BottomTabBar />
      <Drawer />

      {/* Global Add/Edit Transaction sheet — opened via useTransactionSheet */}
      <AddTransactionSheet
        visible={sheetOpen}
        onClose={closeSheet}
        editing={sheetEditing}
        initialType={sheetInitialType}
      />
    </View>
  );
}
