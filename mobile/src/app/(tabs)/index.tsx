// app/(tabs)/index.tsx — Dashboard
//
// Wired to GET /api/dashboard (same payload the web app uses). Visual
// hierarchy from top to bottom:
//   1. Greeting header        ← "Good morning, Vignesh"
//   2. Hero net-worth card    ← big number, this-month delta, brand gradient
//   3. Income / Expense pair  ← two MetricCards in a row
//   4. Spending donut         ← top categories with legend
//   5. Recent activity        ← 5 most recent transactions

import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react-native";
import { PieChart } from "react-native-gifted-charts";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { getCategoryPalette } from "@money-nest/shared";
import { useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { Skeleton } from "@/components/ui/Skeleton";

interface DashboardPayload {
  totalBalance?: number;
  totalIncome?: number;
  totalExpense?: number;
  monthIncome?: number;
  monthExpense?: number;
  monthNet?: number;
  monthLabel?: string;
  incomeChange?: string | null;
  expenseChange?: string | null;
  savingsRate?: string | null;
  totalGoals?: number;
  activeBudgets?: number;
  categoryBreakdown?: Array<{
    category: string;
    amount: number;
    percentage: string | number;
  }>;
  recentTransactions?: Array<{
    _id: string;
    description: string;
    category: string;
    amount: number;
    type: "income" | "expense" | "transfer";
    date: string;
  }>;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export default function DashboardScreen() {
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const [hidden, setHidden] = useState(false);

  const { data, isLoading, isRefetching, refetch, error } =
    useQuery<DashboardPayload>({
      queryKey: ["dashboard"],
      queryFn: () => api<DashboardPayload>("/api/dashboard"),
    });

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const donut = useMemo(() => {
    const rows = (data?.categoryBreakdown ?? []).slice(0, 5);
    return rows.map((r) => {
      const palette = getCategoryPalette(r.category);
      return {
        value: r.amount,
        color: palette.accent,
        label: r.category,
        percent: typeof r.percentage === "string" ? Number(r.percentage) : r.percentage,
      };
    });
  }, [data?.categoryBreakdown]);

  const recent = data?.recentTransactions ?? [];

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50 dark:bg-neutral-950"
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Greeting */}
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-1 mr-3">
            <Text className="text-sm text-gray-500 dark:text-neutral-400">
              {greeting()},
            </Text>
            <Text
              className="text-2xl font-bold text-gray-900 dark:text-neutral-50"
              style={{ letterSpacing: -0.4 }}
              numberOfLines={1}
            >
              {user?.name?.split(" ")[0] ?? "Friend"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)" as never)}
            className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 items-center justify-center active:opacity-70"
          >
            <Bell size={18} color="#374151" />
          </Pressable>
        </View>

        {/* Hero net worth card */}
        <View className="mb-4 rounded-3xl overflow-hidden">
          <LinearGradient
            colors={["#4f46e5", "#312e81"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24 }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                Net Worth
              </Text>
              <Pressable
                onPress={() => setHidden((v) => !v)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:opacity-70"
              >
                {hidden ? (
                  <EyeOff size={14} color="#e0e7ff" />
                ) : (
                  <Eye size={14} color="#e0e7ff" />
                )}
              </Pressable>
            </View>

            {isLoading ? (
              <Skeleton width={200} height={36} radius={8} />
            ) : (
              <Text
                className="text-white text-4xl font-bold"
                style={{ letterSpacing: -1 }}
              >
                {hidden ? "•••••••" : formatCurrency(data?.totalBalance ?? 0)}
              </Text>
            )}

            <View className="flex-row items-center mt-4">
              <View className="bg-white/15 rounded-full px-3 py-1.5">
                <Text className="text-white text-[11px] font-semibold">
                  {data?.monthLabel ?? "This month"}
                </Text>
              </View>
              <Text className="text-indigo-100 text-xs ml-2">
                {data?.savingsRate != null
                  ? `${data.savingsRate}% saved`
                  : ""}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Income / Expense pair */}
        <View className="flex-row gap-3 mb-4">
          {isLoading ? (
            <>
              <SectionCard density="compact" className="flex-1">
                <Skeleton width={36} height={36} radius={12} />
                <Skeleton width="60%" height={10} style={{ marginTop: 12 }} />
                <Skeleton width="80%" height={20} style={{ marginTop: 8 }} />
              </SectionCard>
              <SectionCard density="compact" className="flex-1">
                <Skeleton width={36} height={36} radius={12} />
                <Skeleton width="60%" height={10} style={{ marginTop: 12 }} />
                <Skeleton width="80%" height={20} style={{ marginTop: 8 }} />
              </SectionCard>
            </>
          ) : (
            <>
              <MetricCard
                label="Income"
                value={formatCurrency(data?.monthIncome ?? 0)}
                tone="emerald"
                Icon={ArrowDownLeft}
                delta={
                  data?.incomeChange != null && !Number.isNaN(Number(data.incomeChange))
                    ? {
                        value: `${Math.abs(Number(data.incomeChange))}%`,
                        positive: Number(data.incomeChange) >= 0,
                      }
                    : null
                }
              />
              <MetricCard
                label="Expense"
                value={formatCurrency(data?.monthExpense ?? 0)}
                tone="rose"
                Icon={ArrowUpRight}
                delta={
                  data?.expenseChange != null && !Number.isNaN(Number(data.expenseChange))
                    ? {
                        // For expenses, "positive" delta means going DOWN is good.
                        value: `${Math.abs(Number(data.expenseChange))}%`,
                        positive: Number(data.expenseChange) <= 0,
                      }
                    : null
                }
              />
            </>
          )}
        </View>

        {/* Spending breakdown donut */}
        <SectionCard className="mb-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-900 dark:text-neutral-100">
              Spending breakdown
            </Text>
            <Text className="text-xs text-gray-500 dark:text-neutral-400">
              {data?.monthLabel ?? ""}
            </Text>
          </View>
          <Text className="text-xs text-gray-500 dark:text-neutral-400 mb-4">
            Top categories this month
          </Text>

          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : donut.length === 0 ? (
            <Text className="text-sm text-gray-500 dark:text-neutral-400 text-center py-8">
              No expenses recorded yet.
            </Text>
          ) : (
            <View className="flex-row items-center mt-2">
              <PieChart
                data={donut}
                donut
                radius={70}
                innerRadius={48}
                innerCircleColor="#ffffff"
                innerCircleBorderWidth={0}
                centerLabelComponent={() => (
                  <View className="items-center">
                    <Text className="text-[10px] text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">
                      Total
                    </Text>
                    <Text
                      className="text-sm font-bold text-gray-900 dark:text-neutral-100"
                      style={{ letterSpacing: -0.2 }}
                    >
                      {formatCurrency(
                        donut.reduce((sum, s) => sum + s.value, 0),
                      )}
                    </Text>
                  </View>
                )}
              />
              <View className="flex-1 ml-5">
                {donut.map((slice) => (
                  <View
                    key={slice.label}
                    className="flex-row items-center justify-between mb-2 last:mb-0"
                  >
                    <View className="flex-row items-center flex-1 min-w-0">
                      <View
                        className="w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: slice.color }}
                      />
                      <Text
                        className="text-xs font-medium text-gray-700 dark:text-neutral-300 flex-1"
                        numberOfLines={1}
                      >
                        {slice.label}
                      </Text>
                    </View>
                    <Text className="text-xs font-semibold text-gray-500 dark:text-neutral-400 ml-2">
                      {slice.percent}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </SectionCard>

        {/* Recent activity */}
        <SectionCard density="compact" className="mb-4">
          <View className="flex-row items-center justify-between mb-2 px-2 pt-2">
            <Text className="text-base font-semibold text-gray-900 dark:text-neutral-100">
              Recent activity
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/transactions" as never)}
              className="flex-row items-center active:opacity-70"
            >
              <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 mr-0.5">
                See all
              </Text>
              <ChevronRight size={14} color="#6366f1" />
            </Pressable>
          </View>

          {isLoading ? (
            <View className="px-2 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} className="flex-row items-center py-2.5">
                  <Skeleton width={40} height={40} radius={14} />
                  <View className="flex-1 ml-3">
                    <Skeleton width="55%" height={12} />
                    <Skeleton
                      width="30%"
                      height={10}
                      style={{ marginTop: 6 }}
                    />
                  </View>
                  <Skeleton width={60} height={14} />
                </View>
              ))}
            </View>
          ) : error ? (
            <View className="py-6 items-center">
              <Text className="text-sm text-rose-600 dark:text-rose-300">
                {(error as Error).message}
              </Text>
            </View>
          ) : recent.length === 0 ? (
            <Text className="text-sm text-gray-500 dark:text-neutral-400 text-center py-8">
              No transactions yet. Tap a tab to add your first.
            </Text>
          ) : (
            recent.slice(0, 5).map((tx, i) => <ActivityRow key={tx._id} tx={tx} last={i === Math.min(4, recent.length - 1)} />)
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActivityRow({
  tx,
  last,
}: {
  tx: {
    _id: string;
    description: string;
    category: string;
    amount: number;
    type: "income" | "expense" | "transfer";
    date: string;
  };
  last: boolean;
}) {
  const palette = getCategoryPalette(tx.category);
  const sign = tx.type === "expense" ? "-" : tx.type === "income" ? "+" : "";
  const amountColor =
    tx.type === "expense"
      ? "text-rose-600 dark:text-rose-300"
      : tx.type === "income"
        ? "text-emerald-600 dark:text-emerald-300"
        : "text-blue-600 dark:text-blue-300";

  return (
    <View
      className={`flex-row items-center px-2 py-2.5 ${
        last ? "" : "border-b border-gray-100 dark:border-neutral-800"
      }`}
    >
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
        style={{ backgroundColor: palette.bgLight }}
      >
        <Text
          className="text-sm font-bold"
          style={{ color: palette.textLight }}
        >
          {tx.category.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1 min-w-0 mr-2">
        <Text
          className="text-sm font-semibold text-gray-900 dark:text-neutral-100"
          numberOfLines={1}
        >
          {tx.description || tx.category}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
          {tx.category} · {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </Text>
      </View>
      <Text className={`text-sm font-bold ${amountColor}`} style={{ letterSpacing: -0.2 }}>
        {sign}
        {formatCurrency(tx.amount)}
      </Text>
    </View>
  );
}
