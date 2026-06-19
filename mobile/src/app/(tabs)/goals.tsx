// app/(tabs)/goals.tsx — Goals
// 1:1 port of the Mobile UI mock's goals list:
//   - Top bar with back + plus button (plus opens new-goal sheet)
//   - "Total Saved" hero card with combined progress
//   - Per-goal cards (color-tinted icon + due date + saved/target + bar)
//   - "+ Add new goal" dashed card at the bottom

import { tint, lightenHex } from "@/lib/colors";

import { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Briefcase,
  Car,
  Gift,
  GraduationCap,
  Home,
  Plane,
  Plus,
  ShieldCheck,
  Smartphone,
  Tag,
  type LucideIcon,
} from "lucide-react-native";
import dayjs from "dayjs";

import { useColorScheme } from "@/hooks/useAppColorScheme";
import { useGoals, type GoalDoc } from "@/hooks/useGoals";
import { useDrawer } from "@/lib/stores";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";

import { GoalSheet } from "@/components/goals/GoalSheet";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Skeleton } from "@/components/ui/Skeleton";

function iconForCategory(c: string): LucideIcon {
  switch (c) {
    case "Emergency":
      return ShieldCheck;
    case "Travel":
      return Plane;
    case "House":
      return Home;
    case "Vehicle":
      return Car;
    case "Gadget":
      return Smartphone;
    case "Gift":
      return Gift;
    case "Education":
      return GraduationCap;
    default:
      return Briefcase;
  }
}

export default function GoalsScreen() {
  const dark = useColorScheme() === "dark";
  const router = useRouter();
  const openDrawer = useDrawer((s) => s.toggle);
  const { data: goals = [], isLoading, isRefetching, refetch } = useGoals();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<GoalDoc | null>(null);

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const totals = useMemo(() => {
    const target = goals.reduce((s, g) => s + g.target, 0);
    const saved = goals.reduce((s, g) => s + g.saved, 0);
    const active = goals.filter((g) => !g.isCompleted).length;
    return { target, saved, active, pct: target > 0 ? (saved / target) * 100 : 0 };
  }, [goals]);

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHead
          title="Goals"
          subtitle="Save for what matters"
          onMenu={openDrawer}
          trailing={
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Add goal"
              android_ripple={{ color: "rgba(255,255,255,0.18)", borderless: true }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: Tokens.brand,
                marginTop: 4,
                shadowColor: Tokens.brand,
                shadowOpacity: 0.35,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 4,
                overflow: "hidden",
              }}
            >
              <Plus size={18} color="#ffffff" strokeWidth={2.4} />
            </Pressable>
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140, paddingTop: 4 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={Tokens.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Total saved hero */}
        {isLoading ? (
          <Card style={{ padding: 20, marginBottom: 14 }}>
            <Skeleton width="40%" height={11} />
            <View style={{ height: 12 }} />
            <Skeleton width="70%" height={28} />
            <View style={{ height: 14 }} />
            <Skeleton width="100%" height={6} radius={99} />
          </Card>
        ) : (
          <Card style={{ padding: 20, marginBottom: 14 }}>
            <Text
              className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase"
              style={{ letterSpacing: 0.8 }}
            >
              Total saved
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 6, gap: 6 }}>
              <Money
                value={totals.saved}
                className="text-fg dark:text-fg-dark text-[28px] font-bold"
                style={{ letterSpacing: -0.8 }}
              />
              <Text
                className="text-fg-muted dark:text-fg-dark-muted text-[13px]"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                / {formatCurrency(totals.target)}
              </Text>
            </View>
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-1.5">
              {totals.active} active goal{totals.active === 1 ? "" : "s"} · {totals.pct.toFixed(0)}% complete
            </Text>
            <View
              style={{
                marginTop: 14,
                height: 8,
                borderRadius: 99,
                backgroundColor: dark ? Tokens.bgElevDark : Tokens.bgElev,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={[Tokens.brand3, Tokens.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: `${Math.min(100, totals.pct)}%`,
                  height: "100%",
                  borderRadius: 99,
                }}
              />
            </View>
          </Card>
        )}

        {/* Goal cards */}
        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <Card key={i} style={{ padding: 16 }}>
                <Skeleton width={36} height={36} radius={11} />
                <View style={{ height: 10 }} />
                <Skeleton width="60%" height={14} />
                <View style={{ height: 6 }} />
                <Skeleton width="40%" height={13} />
                <View style={{ height: 10 }} />
                <Skeleton width="100%" height={6} radius={99} />
              </Card>
            ))}
          </View>
        ) : goals.length === 0 ? null : (
          <View style={{ gap: 12 }}>
            {goals.map((g) => (
              <GoalCard
                key={g._id}
                goal={g}
                dark={dark}
                onPress={() => router.push(`/goals/${g._id}`)}
                onEdit={() => {
                  setEditing(g);
                  setSheetOpen(true);
                }}
              />
            ))}
          </View>
        )}

        {/* Add new goal — always shown at the bottom of the list */}
        <Pressable
          onPress={openCreate}
          android_ripple={{ color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
          style={{
            marginTop: 14,
            padding: 24,
            borderRadius: 22,
            alignItems: "center",
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: dark ? Tokens.borderDark : Tokens.borderStrong,
            backgroundColor: dark ? Tokens.cardSoftDark : Tokens.cardSoft,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: dark ? "#1e3a8a55" : Tokens.brandSoft,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Plus size={20} color={Tokens.brand} strokeWidth={2.4} />
          </View>
          <Text className="text-fg dark:text-fg-dark text-[14.5px] font-semibold">
            Add new goal
          </Text>
          <Text className="text-fg-muted dark:text-fg-dark-muted text-[12px] mt-1">
            Save for something special
          </Text>
        </Pressable>
      </ScrollView>

      <GoalSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        editing={editing}
      />
    </SafeAreaView>
  );
}

function GoalCard({
  goal,
  dark,
  onPress,
}: {
  goal: GoalDoc;
  dark: boolean;
  onPress: () => void;
  onEdit: () => void;
}) {
  const Icon = iconForCategory(goal.category);
  const color = goal.color || Tokens.brand;
  const pct = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;
  const toGo = Math.max(0, goal.target - goal.saved);
  const due = goal.deadline ? dayjs(goal.deadline).format("MMM YYYY") : null;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
      style={{
        padding: 16,
        borderRadius: 22,
        backgroundColor: dark ? Tokens.cardDark : Tokens.card,
        borderWidth: 1,
        borderColor: dark ? Tokens.borderDark : Tokens.border,
        shadowColor: "#0f1224",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
        overflow: "hidden",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: tint(color, dark ? 0.2 : 0.14),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color={color} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }} />
        {due ? (
          <Text
            className="text-fg-muted dark:text-fg-dark-muted text-[11px] font-semibold"
            style={{ letterSpacing: 0.2 }}
          >
            {due}
          </Text>
        ) : null}
      </View>

      <Text
        className="text-fg dark:text-fg-dark text-[15px] font-bold mt-3"
        style={{ letterSpacing: -0.2 }}
        numberOfLines={1}
      >
        {goal.name}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 2, gap: 5 }}>
        <Money
          value={goal.saved}
          className="text-fg dark:text-fg-dark text-[18px] font-bold"
          style={{ letterSpacing: -0.4 }}
        />
        <Text
          className="text-fg-muted dark:text-fg-dark-muted text-[12.5px]"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          / {formatCurrency(goal.target)}
        </Text>
      </View>

      {/* Progress bar — goal color, gradient finish */}
      <View
        style={{
          marginTop: 12,
          height: 7,
          borderRadius: 99,
          backgroundColor: dark ? Tokens.bgElevDark : Tokens.bgElev,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={[color, lightenHex(color, 0.2)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${pct}%`, height: "100%", borderRadius: 99 }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <Text className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] font-semibold">
          {pct.toFixed(0)}% complete
        </Text>
        <Text
          style={{
            fontSize: 11.5,
            fontWeight: "700",
            color,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatCurrency(toGo)} to go
        </Text>
      </View>
    </Pressable>
  );
}
