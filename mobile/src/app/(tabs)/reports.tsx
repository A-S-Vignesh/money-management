// app/(tabs)/reports.tsx — Reports
//
// Mirrors GET /api/reports payload. UI:
//   1. ScreenHeader + animated PeriodSelector (W/M/Q/Y)
//   2. Hero block — net for the period, savings rate, delta vs prev period
//   3. Income vs Expense BarChart
//   4. Expense donut (top categories with percentages)
//   5. Top spenders list (top 5 expense transactions)

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, PieChart } from "react-native-gifted-charts";

import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { getCategoryPalette } from "@money-nest/shared";
import { SectionCard } from "@/components/ui/SectionCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PeriodSelector, type Period } from "@/components/ui/PeriodSelector";

interface ReportsPayload {
  window: { startDate: string; endDate: string; bucketUnit: "day" | "week" | "month" };
  summary: {
    income: number;
    expense: number;
    net: number;
    savingsRate: number;
    totalTransactions: number;
  };
  comparison: null | {
    deltas: {
      income: number | null;
      expense: number | null;
      net: number | null;
      savingsRate: number;
    };
  };
  timeSeries: Array<{
    bucket: string;
    label: string;
    income: number;
    expense: number;
    net: number;
  }>;
  byCategory: {
    expense: Array<{ category: string; amount: number; percentage: number }>;
  };
  topExpenses: Array<{
    _id: string;
    description: string;
    category: string;
    amount: number;
    date: string;
  }>;
}

function periodWindow(period: Period): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  if (period === "W") start.setDate(end.getDate() - 6);
  else if (period === "M") start.setDate(end.getDate() - 29);
  else if (period === "Q") start.setDate(end.getDate() - 89);
  else start.setDate(end.getDate() - 364);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

export default function ReportsScreen() {
  const [period, setPeriod] = useState<Period>("M");
  const { start, end } = useMemo(() => periodWindow(period), [period]);

  const { data, isLoading, isRefetching, refetch, error } = useQuery<ReportsPayload>({
    queryKey: ["reports", period, start, end],
    queryFn: () =>
      api<ReportsPayload>("/api/reports", {
        query: { startDate: start, endDate: end, compare: 1 },
      }),
  });

  // Compress timeSeries when there are many buckets so labels stay readable.
  const barData = useMemo(() => {
    const rows = data?.timeSeries ?? [];
    if (rows.length === 0) return [];
    // For W/M show every bucket; for Q/Y show every other / every third.
    const stride =
      period === "Y" ? Math.max(1, Math.floor(rows.length / 6)) :
      period === "Q" ? Math.max(1, Math.floor(rows.length / 8)) :
      1;
    return rows.map((r, i) => {
      const showLabel = i % stride === 0;
      // Stacked-bar input: each bucket → two entries (income + expense) with
      // spacing only between buckets, not within.
      return [
        {
          value: r.income,
          frontColor: "#10b981",
          gradientColor: "#34d399",
          showGradient: true,
          spacing: 2,
          label: showLabel ? r.label : undefined,
          labelTextStyle: {
            color: "#6b7280",
            fontSize: 10,
            fontWeight: "600" as const,
          },
        },
        {
          value: r.expense,
          frontColor: "#f43f5e",
          gradientColor: "#fb7185",
          showGradient: true,
          spacing: 18,
        },
      ];
    }).flat();
  }, [data?.timeSeries, period]);

  const maxBar = useMemo(() => {
    let m = 0;
    for (const r of data?.timeSeries ?? []) {
      m = Math.max(m, r.income, r.expense);
    }
    // Round to a clean upper bound.
    if (m === 0) return 1000;
    const order = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m / order) * order;
  }, [data?.timeSeries]);

  const donut = useMemo(() => {
    const rows = (data?.byCategory?.expense ?? []).slice(0, 6);
    return rows.map((r) => {
      const palette = getCategoryPalette(r.category);
      return {
        value: r.amount,
        color: palette.accent,
        label: r.category,
        percent: r.percentage,
      };
    });
  }, [data?.byCategory]);

  const summary = data?.summary;
  const deltas = data?.comparison?.deltas;

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
            onRefresh={() => refetch()}
            tintColor="#6366f1"
          />
        }
      >
        <ScreenHeader
          title="Reports"
          subtitle="Money in, money out"
        />

        <View className="mb-4">
          <PeriodSelector value={period} onChange={setPeriod} />
        </View>

        {/* Hero summary */}
        <SectionCard density="spacious" className="mb-4">
          <Text className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-neutral-400 mb-1">
            Net for period
          </Text>
          {isLoading ? (
            <Skeleton width={180} height={36} />
          ) : (
            <Text
              className={`text-3xl font-bold ${
                (summary?.net ?? 0) >= 0
                  ? "text-gray-900 dark:text-neutral-50"
                  : "text-rose-600 dark:text-rose-300"
              }`}
              style={{ letterSpacing: -0.6 }}
            >
              {formatCurrency(summary?.net ?? 0)}
            </Text>
          )}

          <View className="flex-row mt-4 gap-2">
            <DeltaPill
              label="Income"
              delta={deltas?.income ?? null}
              positiveIsGood
            />
            <DeltaPill
              label="Expense"
              delta={deltas?.expense ?? null}
              positiveIsGood={false}
            />
            <View className="flex-1 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
              <Text className="text-[10px] uppercase tracking-wider font-semibold text-indigo-700 dark:text-indigo-300 mb-0.5">
                Saved
              </Text>
              <Text className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {summary?.savingsRate != null ? `${summary.savingsRate}%` : "—"}
              </Text>
            </View>
          </View>
        </SectionCard>

        {/* Income vs Expense */}
        <SectionCard className="mb-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-900 dark:text-neutral-100">
              Income vs Expense
            </Text>
          </View>
          <View className="flex-row items-center mb-4 gap-4">
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
              <Text className="text-xs text-gray-500 dark:text-neutral-400">Income</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5" />
              <Text className="text-xs text-gray-500 dark:text-neutral-400">Expense</Text>
            </View>
          </View>

          {isLoading ? (
            <View className="h-44 items-center justify-center">
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : barData.length === 0 ? (
            <Text className="text-sm text-gray-500 dark:text-neutral-400 text-center py-12">
              No data for this period.
            </Text>
          ) : (
            <BarChart
              data={barData}
              maxValue={maxBar}
              noOfSections={4}
              barWidth={10}
              barBorderRadius={4}
              yAxisTextStyle={{ color: "#9ca3af", fontSize: 10 }}
              xAxisLabelTextStyle={{ color: "#6b7280", fontSize: 10 }}
              hideRules
              yAxisColor="transparent"
              xAxisColor="transparent"
              spacing={2}
              initialSpacing={8}
              endSpacing={8}
              height={160}
              isAnimated
              animationDuration={500}
            />
          )}
        </SectionCard>

        {/* Category breakdown */}
        <SectionCard className="mb-4">
          <Text className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-1">
            Where money went
          </Text>
          <Text className="text-xs text-gray-500 dark:text-neutral-400 mb-4">
            Expense by category
          </Text>

          {isLoading ? (
            <View className="h-44 items-center justify-center">
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : donut.length === 0 ? (
            <Text className="text-sm text-gray-500 dark:text-neutral-400 text-center py-8">
              No expenses recorded.
            </Text>
          ) : (
            <View className="flex-row items-center">
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
                      {formatCurrency(summary?.expense ?? 0)}
                    </Text>
                  </View>
                )}
              />
              <View className="flex-1 ml-5">
                {donut.slice(0, 5).map((slice) => (
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

        {/* Top spenders */}
        <SectionCard density="compact">
          <Text className="text-base font-semibold text-gray-900 dark:text-neutral-100 px-2 pt-2 mb-2">
            Top spends
          </Text>
          {isLoading ? (
            <View className="px-2 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} className="flex-row items-center py-2.5">
                  <Skeleton width={40} height={40} radius={14} />
                  <View className="flex-1 ml-3">
                    <Skeleton width="55%" height={12} />
                    <Skeleton width="30%" height={10} style={{ marginTop: 6 }} />
                  </View>
                  <Skeleton width={60} height={14} />
                </View>
              ))}
            </View>
          ) : error ? (
            <Text className="text-sm text-rose-600 dark:text-rose-300 text-center py-6">
              {(error as Error).message}
            </Text>
          ) : (data?.topExpenses ?? []).length === 0 ? (
            <Text className="text-sm text-gray-500 dark:text-neutral-400 text-center py-8">
              Nothing notable.
            </Text>
          ) : (
            (data?.topExpenses ?? []).map((tx, i) => {
              const palette = getCategoryPalette(tx.category);
              const last = i === (data?.topExpenses?.length ?? 0) - 1;
              return (
                <View
                  key={tx._id}
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
                      {tx.category} ·{" "}
                      {new Date(tx.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                  <Text
                    className="text-sm font-bold text-rose-600 dark:text-rose-300"
                    style={{ letterSpacing: -0.2 }}
                  >
                    -{formatCurrency(tx.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function DeltaPill({
  label,
  delta,
  positiveIsGood,
}: {
  label: string;
  delta: number | null;
  positiveIsGood: boolean;
}) {
  // For income: positive delta = good (green). For expense: positive = bad.
  const isGood = delta == null ? null : positiveIsGood ? delta >= 0 : delta <= 0;
  const bg =
    isGood == null
      ? "bg-gray-100 dark:bg-neutral-800"
      : isGood
        ? "bg-emerald-50 dark:bg-emerald-950/40"
        : "bg-rose-50 dark:bg-rose-950/40";
  const txt =
    isGood == null
      ? "text-gray-500 dark:text-neutral-400"
      : isGood
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-rose-700 dark:text-rose-300";
  const sign = delta == null ? "" : delta > 0 ? "+" : "";

  return (
    <View className={`flex-1 px-3 py-2 rounded-xl ${bg}`}>
      <Text className={`text-[10px] uppercase tracking-wider font-semibold ${txt} mb-0.5`}>
        {label}
      </Text>
      <Text className={`text-sm font-bold ${txt}`}>
        {delta == null ? "—" : `${sign}${delta}%`}
      </Text>
    </View>
  );
}
