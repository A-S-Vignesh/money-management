// app/(tabs)/reports.tsx — Reports
// 1:1 port of the Mobile UI mock with blue brand accent. The period chips
// select an ISO date window which we send to /api/reports.

import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import dayjs from "dayjs";
import { Download } from "lucide-react-native";

import { api } from "@/lib/api";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";
import { useDrawer } from "@/lib/stores";
import { getCategoryPalette } from "@money-nest/shared";

import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { DualBars } from "@/components/ui/DualBars";
import { LineChart } from "@/components/ui/LineChart";
import { Money } from "@/components/ui/Money";
import { Progress } from "@/components/ui/Progress";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";

type Period = "1M" | "3M" | "6M" | "1Y" | "ALL";

interface ReportsPayload {
  window: { startDate: string; endDate: string; bucketUnit: string };
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
    expense: Array<{
      category: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
  };
}

function periodToRange(p: Period): { start: string; end: string } {
  const today = dayjs();
  const end = today.format("YYYY-MM-DD");
  const start = (() => {
    switch (p) {
      case "1M":
        return today.subtract(1, "month").format("YYYY-MM-DD");
      case "3M":
        return today.subtract(3, "month").format("YYYY-MM-DD");
      case "6M":
        return today.subtract(6, "month").format("YYYY-MM-DD");
      case "1Y":
        return today.subtract(1, "year").format("YYYY-MM-DD");
      case "ALL":
        return "2000-01-01";
    }
  })();
  return { start, end };
}

export default function ReportsScreen() {
  const [period, setPeriod] = useState<Period>("6M");
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 32 - 36; // page padding + card padding

  const range = useMemo(() => periodToRange(period), [period]);

  const { data, isLoading, isRefetching, refetch } = useQuery<ReportsPayload>({
    queryKey: ["reports", period],
    queryFn: () =>
      api<ReportsPayload>("/api/reports", {
        query: { startDate: range.start, endDate: range.end, compare: 1 },
      }),
  });

  const onRefresh = useCallback(() => refetch(), [refetch]);
  const summary = data?.summary;

  // ── Build dual-bar series from timeSeries ─────────────────────
  const barSeries = useMemo(() => {
    const ts = data?.timeSeries ?? [];
    if (ts.length === 0) return [];
    // Cap to 8 bars for legibility — sample evenly from the series.
    const target = 8;
    if (ts.length <= target) {
      return ts.map((r) => ({ label: r.label, inc: r.income, exp: r.expense }));
    }
    const stride = ts.length / target;
    return Array.from({ length: target }, (_, i) => {
      const r = ts[Math.floor(i * stride)];
      return { label: r.label, inc: r.income, exp: r.expense };
    });
  }, [data?.timeSeries]);

  // ── Cumulative net worth trend for the line chart ─────────────
  const trendValues = useMemo(() => {
    const ts = data?.timeSeries ?? [];
    if (ts.length === 0) return [];
    let net = 0;
    return ts.map((r) => {
      net += r.income - r.expense;
      return net;
    });
  }, [data?.timeSeries]);

  const trendLabels = useMemo(() => {
    const ts = data?.timeSeries ?? [];
    if (ts.length < 2) return undefined;
    const picks = [0, Math.floor(ts.length * 0.25), Math.floor(ts.length * 0.5), Math.floor(ts.length * 0.75), ts.length - 1];
    return picks.map((i) => ts[i]?.label ?? "");
  }, [data?.timeSeries]);

  const breakdown = data?.byCategory?.expense ?? [];

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      {/* Fixed top bar — see Dashboard for rationale. */}
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHead
          title="Reports"
          subtitle="Insights and trends"
          onMenu={useDrawer.getState().toggle}
          trailing={<DownloadButton />}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140, paddingTop: 4 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Tokens.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period chips */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
          {(["1M", "3M", "6M", "1Y", "ALL"] as Period[]).map((p) => (
            <Chip
              key={p}
              label={p === "ALL" ? "All" : p}
              active={period === p}
              onPress={() => setPeriod(p)}
            />
          ))}
        </View>

        {/* Income vs Expense */}
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <View>
              <Text className="text-fg dark:text-fg-dark text-[16px] font-semibold tracking-tight">
                Income vs Expense
              </Text>
              <Text className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-0.5">
                {period === "ALL" ? "All time" : `Last ${period.toLowerCase()}`}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    backgroundColor: Tokens.emerald,
                  }}
                />
                <Text className="text-fg dark:text-fg-dark text-[11px] font-semibold">
                  In
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    backgroundColor: Tokens.rose,
                  }}
                />
                <Text className="text-fg dark:text-fg-dark text-[11px] font-semibold">
                  Out
                </Text>
              </View>
            </View>
          </View>
          {isLoading ? (
            <Skeleton width="100%" height={160} />
          ) : barSeries.length === 0 ? (
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[13px] text-center py-12">
              No activity in this period.
            </Text>
          ) : (
            <DualBars data={barSeries} height={150} />
          )}
          <View
            className="border-t border-edge dark:border-edge-dark"
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 14,
              paddingTop: 14,
            }}
          >
            <SummaryStat
              label="Total in"
              value={formatCurrency(summary?.income ?? 0, { compact: true })}
              color="emerald"
            />
            <SummaryStat
              label="Total out"
              value={formatCurrency(summary?.expense ?? 0, { compact: true })}
              color="rose"
            />
            <SummaryStat
              label="Avg saved"
              value={`${summary?.savingsRate ?? 0}%`}
              color="brand"
            />
          </View>
        </Card>

        {/* Net worth trend (line) */}
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <View style={{ marginBottom: 8 }}>
            <Text className="text-fg dark:text-fg-dark text-[16px] font-semibold tracking-tight">
              Net worth trend
            </Text>
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-0.5">
              Cumulative net flow
            </Text>
          </View>
          {isLoading ? (
            <Skeleton width="100%" height={140} />
          ) : trendValues.length < 2 ? (
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[13px] text-center py-8">
              Need at least two data points to draw a trend.
            </Text>
          ) : (
            <LineChart
              values={trendValues}
              width={chartWidth}
              height={140}
              stroke={Tokens.brand}
              fill={Tokens.brand}
              labels={trendLabels}
            />
          )}
        </Card>

        {/* Where it goes */}
        <Section title="Where it goes">
          <Card style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
            {isLoading ? (
              <View style={{ gap: 14, paddingVertical: 12 }}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    <Skeleton width={38} height={38} radius={12} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Skeleton width="50%" height={13} />
                      <Skeleton width="100%" height={4} />
                    </View>
                    <Skeleton width={32} height={12} />
                  </View>
                ))}
              </View>
            ) : breakdown.length === 0 ? (
              <Text className="text-fg-muted dark:text-fg-dark-muted text-[13px] text-center py-8">
                No expenses recorded in this period.
              </Text>
            ) : (
              breakdown.map((b, i) => {
                const palette = getCategoryPalette(b.category);
                return (
                  <View
                    key={b.category}
                    className="border-t border-edge dark:border-edge-dark"
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 12,
                      borderTopWidth: i === 0 ? 0 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: palette.bgLight,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: palette.textLight,
                          fontSize: 14,
                          fontWeight: "700",
                        }}
                      >
                        {b.category.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <Text className="text-fg dark:text-fg-dark text-[13.5px] font-semibold">
                          {b.category}
                        </Text>
                        <Money
                          value={b.amount}
                          className="text-fg dark:text-fg-dark text-[13px] font-bold"
                        />
                      </View>
                      <Progress
                        value={b.percentage}
                        height={4}
                        color={palette.accent}
                      />
                    </View>
                    <Text
                      className="text-fg-muted dark:text-fg-dark-muted text-[11px] font-semibold"
                      style={{
                        minWidth: 30,
                        textAlign: "right",
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {b.percentage}%
                    </Text>
                  </View>
                );
              })
            )}
          </Card>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "emerald" | "rose" | "brand";
}) {
  const colorClass =
    color === "emerald"
      ? "text-emerald"
      : color === "rose"
        ? "text-rose"
        : "text-brand";
  return (
    <View style={{ flex: 1 }}>
      <Text
        className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase"
        style={{ letterSpacing: 0.5 }}
      >
        {label}
      </Text>
      <Text
        className={`${colorClass} text-[16px] font-bold mt-0.5`}
        style={{ fontVariant: ["tabular-nums"], letterSpacing: -0.2 }}
      >
        {value}
      </Text>
    </View>
  );
}

// Download button — extracted so the icon color tracks dark mode via the
// hook (we can't call useColorScheme inline inside ScreenHead trailing).
function DownloadButton() {
  const dark = useColorScheme() === "dark";
  return (
    <Pressable
      android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderless: true }}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
        backgroundColor: dark ? Tokens.cardDark : Tokens.card,
        borderWidth: 1,
        borderColor: dark ? Tokens.borderDark : Tokens.border,
      }}
    >
      <Download size={17} color={dark ? Tokens.textDarkPrimary : Tokens.text} strokeWidth={2} />
    </Pressable>
  );
}
