// app/goals/[id].tsx — Goal detail
// 1:1 with the Mobile UI mock's goal detail screen:
//   - Big gradient hero (goal color) with progress bar
//   - Two stat cards: Monthly need + On track?
//   - Two action buttons: + Add money | Edit goal
//   - Contributions list — transactions into the goal's linked account

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
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowDownLeft,
  Briefcase,
  Car,
  Check,
  Edit,
  Gift,
  GraduationCap,
  Home,
  Plane,
  Plus,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react-native";
import dayjs from "dayjs";

import { useColorScheme } from "@/hooks/useAppColorScheme";
import { useGoal } from "@/hooks/useGoals";
import { useTransactions } from "@/hooks/useTransactions";
import { useTransactionSheet } from "@/lib/stores";
import { lightenHex } from "@/lib/colors";
import { useCurrency } from "@/lib/currency";
import { useDateFormat } from "@/lib/dateFormat";
import { Tokens } from "@/lib/design";
import { formatCurrency, formatDate } from "@/lib/format";

import { GoalSheet } from "@/components/goals/GoalSheet";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { Skeleton } from "@/components/ui/Skeleton";

function iconForCategory(c: string): LucideIcon {
  switch (c) {
    case "Emergency": return ShieldCheck;
    case "Travel": return Plane;
    case "House": return Home;
    case "Vehicle": return Car;
    case "Gadget": return Smartphone;
    case "Gift": return Gift;
    case "Education": return GraduationCap;
    default: return Briefcase;
  }
}

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dark = useColorScheme() === "dark";
  const router = useRouter();
  const { data: goal, isLoading, isRefetching, refetch } = useGoal(id);
  const [editOpen, setEditOpen] = useState(false);
  const openAddTransfer = useTransactionSheet((s) => s.openAdd);
  // Re-render on currency / date-format change — see (tabs)/_layout
  // for the same pattern.
  useCurrency((s) => s.code);
  useDateFormat((s) => s.code);

  // Pull recent contributions = transactions where the goal's linked
  // account is the destination. We over-fetch slightly so the
  // toAccountId filter (applied client-side because the endpoint doesn't
  // support it) still yields enough rows to display.
  const { data: txData } = useTransactions({ limit: 50 });
  const contributions = useMemo(() => {
    if (!goal || !txData?.data) return [];
    return txData.data.filter((t) => t.toAccountId === goal.accountId);
  }, [goal, txData]);

  // "Monthly need" = remaining / months until deadline. If the deadline
  // is past or missing, we just show the remaining amount.
  const insights = useMemo(() => {
    if (!goal) return null;
    const remaining = Math.max(0, goal.target - goal.saved);
    const months = goal.deadline
      ? Math.max(1, dayjs(goal.deadline).diff(dayjs(), "month"))
      : null;
    const monthly = months ? remaining / months : remaining;
    // On track = current pace would hit target by deadline. Heuristic:
    // contributions in last 30 days project to monthly need within 80%.
    const recent = (txData?.data ?? [])
      .filter((t) => t.toAccountId === goal.accountId)
      .filter((t) => dayjs(t.date).isAfter(dayjs().subtract(30, "day")))
      .reduce((s, t) => s + t.amount, 0);
    const onTrack = months === null || months === 1
      ? recent >= monthly
      : recent >= monthly * 0.8;
    return { remaining, monthly, onTrack, months };
  }, [goal, txData]);

  const color = goal?.color || Tokens.brand;
  const Icon = iconForCategory(goal?.category ?? "Other");
  const pct = goal && goal.target > 0
    ? Math.min(100, (goal.saved / goal.target) * 100)
    : 0;

  const bg = dark ? "#0a0b0e" : "#f5f6fa";

  return (
    <View
      collapsable={false}
      style={{ flex: 1, backgroundColor: bg }}
    >
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: bg }}>

      {/* Custom back/title row */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          android_ripple={{
            color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            borderless: true,
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: dark ? Tokens.cardDark : Tokens.card,
            borderWidth: 1,
            borderColor: dark ? Tokens.borderDark : Tokens.border,
            overflow: "hidden",
          }}
        >
          <ArrowLeft
            size={18}
            color={dark ? Tokens.textDarkPrimary : Tokens.text}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={Tokens.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        {isLoading || !goal ? (
          <Card style={{ padding: 20, marginBottom: 14, minHeight: 200 }}>
            <Skeleton width={38} height={38} radius={12} />
            <View style={{ height: 14 }} />
            <Skeleton width="70%" height={18} />
            <View style={{ height: 10 }} />
            <Skeleton width="50%" height={28} />
          </Card>
        ) : (
          <LinearGradient
            colors={[color, lightenHex(color, 0.22)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 20,
              borderRadius: 24,
              marginBottom: 14,
              shadowColor: color,
              shadowOpacity: 0.35,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 8,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.22)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Icon size={20} color="#fff" strokeWidth={2.2} />
            </View>
            <Text
              style={{
                color: "#fff",
                fontSize: 22,
                fontWeight: "800",
                letterSpacing: -0.6,
              }}
              numberOfLines={1}
            >
              {goal.name}
            </Text>
            {goal.deadline ? (
              <Text
                style={{
                  color: "rgba(255,255,255,0.78)",
                  fontSize: 12.5,
                  marginTop: 4,
                  fontWeight: "500",
                }}
              >
                Due {dayjs(goal.deadline).format("MMM YYYY")}
              </Text>
            ) : null}
            <Money
              value={goal.saved}
              className="text-white text-[32px] font-bold mt-4"
              style={{ letterSpacing: -1.2 }}
            />
            <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, marginTop: 2 }}>
              of {formatCurrency(goal.target)} goal
            </Text>
            <View
              style={{
                marginTop: 14,
                height: 8,
                borderRadius: 99,
                backgroundColor: "rgba(255,255,255,0.22)",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  backgroundColor: "#fff",
                  borderRadius: 99,
                }}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {pct.toFixed(0)}% complete
              </Text>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {formatCurrency(Math.max(0, goal.target - goal.saved))} to go
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Stat cards */}
        {insights ? (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
            <Card style={{ flex: 1, padding: 14 }}>
              <Text
                className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase"
                style={{ letterSpacing: 0.6 }}
              >
                Monthly need
              </Text>
              <Money
                value={Math.round(insights.monthly)}
                className="text-fg dark:text-fg-dark text-[18px] font-bold mt-1"
                style={{ letterSpacing: -0.3 }}
              />
            </Card>
            <Card style={{ flex: 1, padding: 14 }}>
              <Text
                className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase"
                style={{ letterSpacing: 0.6 }}
              >
                On track?
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <Check
                  size={16}
                  color={insights.onTrack ? Tokens.emerald : Tokens.rose}
                  strokeWidth={3}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: insights.onTrack ? Tokens.emerald : Tokens.rose,
                  }}
                >
                  {insights.onTrack ? "Yes" : "No"}
                </Text>
              </View>
            </Card>
          </View>
        ) : null}

        {/* Action row */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
          <Pressable
            onPress={() => openAddTransfer("expense")}
            android_ripple={{ color: "rgba(255,255,255,0.18)" }}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              backgroundColor: color,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 6,
              shadowColor: color,
              shadowOpacity: 0.35,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
              overflow: "hidden",
            }}
          >
            <Plus size={16} color="#fff" strokeWidth={2.4} />
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
              Add money
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setEditOpen(true)}
            android_ripple={{
              color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            }}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              backgroundColor: dark ? Tokens.cardDark : Tokens.card,
              borderWidth: 1,
              borderColor: dark ? Tokens.borderDark : Tokens.border,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 6,
              overflow: "hidden",
            }}
          >
            <Edit
              size={15}
              color={dark ? Tokens.textDarkPrimary : Tokens.text}
              strokeWidth={2.2}
            />
            <Text
              style={{
                color: dark ? Tokens.textDarkPrimary : Tokens.text,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              Edit goal
            </Text>
          </Pressable>
        </View>

        {/* Contributions */}
        <Text
          className="text-fg dark:text-fg-dark text-[16px] font-bold tracking-tight mb-3"
        >
          Contributions
        </Text>
        {contributions.length === 0 ? (
          <Card style={{ padding: 20, alignItems: "center" }}>
            <Text className="text-fg dark:text-fg-dark text-[14px] font-semibold">
              No contributions yet
            </Text>
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[12px] text-center mt-1">
              Tap "+ Add money" to put your first deposit in.
            </Text>
          </Card>
        ) : (
          <Card style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}>
            {contributions.map((tx, i) => (
              <View
                key={tx._id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  borderBottomWidth: i === contributions.length - 1 ? 0 : 1,
                  borderBottomColor: dark ? Tokens.borderDark : Tokens.border,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    backgroundColor: dark ? "#14532d" : Tokens.emeraldBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowDownLeft
                    size={16}
                    color={Tokens.emerald}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="text-fg dark:text-fg-dark text-[13.5px] font-semibold">
                    {tx.description || "Deposit"}
                  </Text>
                  <Text className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-0.5">
                    {formatDate(tx.date, "full")}
                  </Text>
                </View>
                <Money
                  value={tx.amount}
                  prefix="+"
                  className="text-emerald text-[14px] font-bold"
                />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <GoalSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        editing={goal}
      />
      </SafeAreaView>
    </View>
  );
}

