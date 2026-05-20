// src/app/(tabs)/_layout.tsx
// Uses Expo Router's NativeTabs (the same primitive the SDK 55 starter used
// in `app-tabs.tsx`) — true iOS Liquid Glass + Android Material 3 styling,
// not a JS-rendered tab bar. Auth-gated: bounces unauthed users to /login.

import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Tokens } from "@/lib/design";
import { useAuth } from "@/lib/auth";

export default function TabsLayout() {
  const token = useAuth((s) => s.token);
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  if (!token) return <Redirect href="/(auth)/login" />;

  return (
    <NativeTabs
      backgroundColor={isDark ? Tokens.cardDark : Tokens.card}
      indicatorColor={isDark ? Tokens.bgElevDark : Tokens.bgElev}
      labelStyle={{
        selected: { color: Tokens.brand },
      }}
      tintColor={Tokens.brand}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" drawable="ic_dashboard" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="transactions">
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="list.bullet.rectangle"
          drawable="ic_transactions"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="budgets">
        <NativeTabs.Trigger.Label>Budgets</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="chart.pie.fill"
          drawable="ic_budgets"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="reports">
        <NativeTabs.Trigger.Label>Reports</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="chart.line.uptrend.xyaxis"
          drawable="ic_reports"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>You</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="person.crop.circle.fill"
          drawable="ic_profile"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
