// app/(tabs)/reports.tsx — Reports
// Production layout matching the Mobile UI mock + a few high-value
// additions the mock skipped: comparison deltas (vs previous period),
// income breakdown ("Where it comes from"), and a Highlights card with
// computed insights. All powered by the existing /api/reports payload —
// no backend changes required.

import { tint } from "@/lib/colors";
import { exportTransactionsCSV } from "@/lib/exportData";

import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import dayjs from "dayjs";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Lightbulb,
  type LucideIcon,
} from "lucide-react-native";

import { api } from "@/lib/api";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";
import { useDrawer } from "@/lib/stores";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { getCategoryPalette } from "@/_shared";

import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { DualBars } from "@/components/ui/DualBars";
import { LineChart } from "@/components/ui/LineChart";
import { Money } from "@/components/ui/Money";
import { Progress } from "@/components/ui/Progress";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";
import { useColorScheme } from "@/hooks/useAppColorScheme";

type Period = "1M" | "3M" | "6M" | "1Y" | "ALL";

interface CategoryRow {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

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
    expense: CategoryRow[];
    income: CategoryRow[];
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
  const dark = useColorScheme() === "dark";
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
  const deltas = data?.comparison?.deltas;

  // ── Build dual-bar series from timeSeries ─────────────────────
  const barSeries = useMemo(() => {
    const ts = data?.timeSeries ?? [];
    if (ts.length === 0) return [];
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

  // ── Cumulative net trend for the line chart ──────────────────
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
    const picks = [
      0,
      Math.floor(ts.length * 0.25),
      Math.floor(ts.length * 0.5),
      Math.floor(ts.length * 0.75),
      ts.length - 1,
    ];
    return picks.map((i) => ts[i]?.label ?? "");
  }, [data?.timeSeries]);

  const expenseBreakdown = data?.byCategory?.expense ?? [];
  const incomeBreakdown = data?.byCategory?.income ?? [];

  // ── Highlights — computed insights from the payload ──────────
  // Top expense category, savings-rate change, net flow direction. Kept
  // short so the user gets the "so what?" at a glance instead of
  // scanning the raw charts.
  const highlights = useMemo(() => {
    if (!summary || !data) return [];
    const out: Array<{ Icon: LucideIcon; color: string; text: string }> = [];

    const topExpense = expenseBreakdown[0];
    if (topExpense) {
      out.push({
        Icon: ArrowUpRight,
        color: Tokens.rose,
        text: `${topExpense.category} was your biggest spend — ${formatCurrency(topExpense.amount)} (${topExpense.percentage}%).`,
      });
    }

    if (deltas?.savingsRate !== undefined && deltas.savingsRate !== 0) {
      const up = deltas.savingsRate > 0;
      out.push({
        Icon: Lightbulb,
        color: up ? Tokens.emerald : Tokens.amber,
        text: `Savings rate ${up ? "up" : "down"} ${Math.abs(deltas.savingsRate).toFixed(0)} pts vs previous period (now ${summary.savingsRate}%).`,
      });
    }

    if (summary.net !== 0) {
      const positive = summary.net > 0;
      out.push({
        Icon: positive ? ArrowDownLeft : ArrowUpRight,
        color: positive ? Tokens.emerald : Tokens.rose,
        text: positive
          ? `You ended the period ${formatCurrency(summary.net)} richer.`
          : `You spent ${formatCurrency(Math.abs(summary.net))} more than you earned.`,
      });
    }

    return out;
  }, [summary, deltas, expenseBreakdown, data]);

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
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
                {summary?.totalTransactions
                  ? ` · ${summary.totalTransactions} transactions`
                  : ""}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
              <LegendDot color={Tokens.emerald} label="In" />
              <LegendDot color={Tokens.rose} label="Out" />
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
          {/* Summary stats — now with comparison delta pills */}
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
              delta={deltas?.income ?? null}
            />
            <SummaryStat
              label="Total out"
              value={formatCurrency(summary?.expense ?? 0, { compact: true })}
              color="rose"
              delta={deltas?.expense ?? null}
              /* Lower expense is good, so invert direction colouring */
              deltaInverted
            />
            <SummaryStat
              label="Avg saved"
              value={`${summary?.savingsRate ?? 0}%`}
              color="brand"
              delta={deltas?.savingsRate ?? null}
              deltaIsPoints
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

        {/* Highlights — short, computed insights so the user gets the
            "so what?" without scanning raw charts. */}
        {highlights.length > 0 ? (
          <Card
            style={{ padding: 14, marginBottom: 16, gap: 10 }}
            soft
          >
            {highlights.map((h, i) => (
              <View
                key={i}
                style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: tint(h.color, dark ? 0.22 : 0.12),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <h.Icon size={14} color={h.color} strokeWidth={2.4} />
                </View>
                <Text
                  className="text-fg dark:text-fg-dark text-[12.5px]"
                  style={{ flex: 1, lineHeight: 18 }}
                >
                  {h.text}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        {/* Where it goes — expense breakdown */}
        <Section title="Where it goes">
          <Card style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
            {isLoading ? (
              <BreakdownSkeleton />
            ) : expenseBreakdown.length === 0 ? (
              <Text className="text-fg-muted dark:text-fg-dark-muted text-[13px] text-center py-8">
                No expenses recorded in this period.
              </Text>
            ) : (
              expenseBreakdown.map((b, i) => (
                <BreakdownRow
                  key={b.category}
                  row={b}
                  dark={dark}
                  first={i === 0}
                />
              ))
            )}
          </Card>
        </Section>

        {/* Where it comes from — income breakdown. Only show when there
            are non-zero income entries; otherwise it's noise. */}
        {incomeBreakdown.length > 0 ? (
          <Section title="Where it comes from">
            <Card style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
              {incomeBreakdown.map((b, i) => (
                <BreakdownRow
                  key={b.category}
                  row={b}
                  dark={dark}
                  first={i === 0}
                />
              ))}
            </Card>
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 99,
          backgroundColor: color,
        }}
      />
      <Text className="text-fg dark:text-fg-dark text-[11px] font-semibold">
        {label}
      </Text>
    </View>
  );
}

function SummaryStat({
  label,
  value,
  color,
  delta,
  deltaInverted,
  deltaIsPoints,
}: {
  label: string;
  value: string;
  color: "emerald" | "rose" | "brand";
  delta?: number | null;
  /** When true, a NEGATIVE delta is "good" (e.g. spending less). Flips
   *  the up/down arrow + green/red colouring. */
  deltaInverted?: boolean;
  /** Show delta in absolute points (e.g. savings-rate pp) instead of %. */
  deltaIsPoints?: boolean;
}) {
  const colorClass =
    color === "emerald"
      ? "text-emerald"
      : color === "rose"
        ? "text-rose"
        : "text-brand";

  // Resolve the delta presentation. `null` = backend had no prior period
  // to compare against, so the chip is hidden entirely.
  let deltaText: string | null = null;
  let deltaColor: string | null = null;
  if (typeof delta === "number" && !isNaN(delta) && delta !== 0) {
    const rising = delta > 0;
    const good = deltaInverted ? !rising : rising;
    deltaColor = good ? Tokens.emerald : Tokens.rose;
    const arrow = rising ? "↑" : "↓";
    const mag = Math.abs(delta).toFixed(deltaIsPoints ? 0 : 1);
    deltaText = `${arrow} ${mag}${deltaIsPoints ? "pp" : "%"}`;
  }

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
      {deltaText ? (
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: deltaColor!,
            marginTop: 2,
            fontVariant: ["tabular-nums"],
          }}
        >
          {deltaText}
        </Text>
      ) : null}
    </View>
  );
}

function BreakdownRow({
  row,
  dark,
  first,
}: {
  row: CategoryRow;
  dark: boolean;
  first: boolean;
}) {
  const palette = getCategoryPalette(row.category);
  const Icon = getCategoryIcon(row.category);
  return (
    <View
      className="border-t border-edge dark:border-edge-dark"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderTopWidth: first ? 0 : 1,
      }}
    >
      {/* Lucide category icon — same monogram pattern used by TxRow so
          the reports breakdown matches the transactions list visually. */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: dark ? palette.bgDark : palette.bgLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          size={18}
          color={dark ? palette.textDark : palette.textLight}
          strokeWidth={2}
        />
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
            {row.category}
          </Text>
          <Money
            value={row.amount}
            className="text-fg dark:text-fg-dark text-[13px] font-bold"
          />
        </View>
        <Progress value={row.percentage} height={4} color={palette.accent} />
      </View>
      <Text
        className="text-fg-muted dark:text-fg-dark-muted text-[11px] font-semibold"
        style={{
          minWidth: 30,
          textAlign: "right",
          fontVariant: ["tabular-nums"],
        }}
      >
        {row.percentage}%
      </Text>
    </View>
  );
}

function BreakdownSkeleton() {
  return (
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
  );
}

function DownloadButton() {
  const dark = useColorScheme() === "dark";
  return (
    <Pressable
      onPress={() => exportTransactionsCSV()}
      accessibilityRole="button"
      accessibilityLabel="Export transactions"
      accessibilityHint="Exports all your transactions as a CSV file and opens the share sheet"
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
        marginTop: 6,
        backgroundColor: dark ? Tokens.cardDark : Tokens.card,
        borderWidth: 1,
        borderColor: dark ? Tokens.borderDark : Tokens.border,
      }}
    >
      <Download
        size={17}
        color={dark ? Tokens.textDarkPrimary : Tokens.text}
        strokeWidth={2}
      />
    </Pressable>
  );
}

