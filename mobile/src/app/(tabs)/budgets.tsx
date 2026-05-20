// app/(tabs)/budgets.tsx — Budgets
// 1:1 port of the Mobile UI mock with blue brand accent.
//
// Layout (top → bottom):
//   1. ScreenHead — "Budgets" title + subtitle + hamburger
//   2. Hero card — total spent this month vs total allocated + progress bar
//                  + "X categories over budget" alert
//   3. Categories card — one row per budget: icon + name + spent/allocated
//      + % + remaining + colored progress bar
//   4. Smart suggestion card — recommends bumping the worst-overspent budget

import { useCallback, useMemo } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, Plus, Sparkles } from "lucide-react-native";

import { getCategoryPalette } from "@money-nest/shared";
import { useBudgets, type BudgetDoc } from "@/hooks/useBudgets";
import { useDrawer } from "@/lib/stores";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";
import { getCategoryIcon } from "@/lib/categoryIcons";

import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";

// Bucket the spent / allocated ratio into a status that drives both the
// progress-bar color and the textual "left" / "over by" descriptor. Same
// thresholds as the Mobile UI mock: <70 green, 70–90 amber, ≥100 rose.
type Status = "ok" | "warn" | "over";
function statusFor(spent: number, allocated: number): Status {
  if (allocated <= 0) return "ok";
  const pct = (spent / allocated) * 100;
  if (pct >= 100) return "over";
  if (pct >= 70) return "warn";
  return "ok";
}
function statusColor(s: Status): string {
  if (s === "over") return Tokens.rose;
  if (s === "warn") return Tokens.amber;
  return Tokens.emerald;
}

export default function BudgetsScreen() {
  const dark = useColorScheme() === "dark";
  const openDrawer = useDrawer((s) => s.toggle);
  const { data: budgets = [], isLoading, isRefetching, refetch } = useBudgets();

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const totals = useMemo(() => {
    const allocated = budgets.reduce((s, b) => s + (b.allocated ?? 0), 0);
    const spent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0);
    const overCount = budgets.filter((b) => statusFor(b.spent, b.allocated) === "over").length;
    return { allocated, spent, overCount, pct: allocated > 0 ? (spent / allocated) * 100 : 0 };
  }, [budgets]);

  // Smart suggestion — find the most over-budget category and propose a
  // higher allocation (round up the current overspend to the next 500).
  const suggestion = useMemo(() => {
    const worst = budgets
      .map((b) => ({ b, over: b.spent - b.allocated }))
      .filter((x) => x.over > 0)
      .sort((a, b) => b.over - a.over)[0];
    if (!worst) return null;
    const next = Math.ceil(worst.b.spent / 500) * 500;
    return { category: worst.b.category, current: worst.b.allocated, next };
  }, [budgets]);

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHead
          title="Budgets"
          subtitle="Track spending vs your monthly limits"
          onMenu={openDrawer}
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
        {/* Hero card */}
        {isLoading ? (
          <Card style={{ padding: 18, marginBottom: 16 }}>
            <Skeleton width="40%" height={11} />
            <View style={{ height: 12 }} />
            <Skeleton width="60%" height={28} />
            <View style={{ height: 12 }} />
            <Skeleton width="100%" height={8} radius={99} />
          </Card>
        ) : (
          <HeroCard totals={totals} dark={dark} />
        )}

        {/* Categories */}
        <Section
          title="Categories"
          trailing={
            <Pressable
              hitSlop={6}
              android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Plus size={14} color={Tokens.brand} strokeWidth={2.4} />
              <Text style={{ color: Tokens.brand, fontSize: 13, fontWeight: "600" }}>New</Text>
            </Pressable>
          }
        >
          {isLoading ? (
            <Card style={{ padding: 16, gap: 14 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Skeleton width={38} height={38} radius={12} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="40%" height={11} />
                  </View>
                  <Skeleton width={50} height={16} />
                </View>
              ))}
            </Card>
          ) : budgets.length === 0 ? (
            <Card style={{ padding: 24, alignItems: "center" }}>
              <Text className="text-fg dark:text-fg-dark text-[15px] font-semibold">
                No budgets yet
              </Text>
              <Text className="text-fg-muted dark:text-fg-dark-muted text-[12.5px] text-center mt-1">
                Tap "+ New" to create your first category budget.
              </Text>
            </Card>
          ) : (
            <Card style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}>
              {budgets.map((b, i) => (
                <BudgetRow
                  key={b._id}
                  budget={b}
                  dark={dark}
                  last={i === budgets.length - 1}
                />
              ))}
            </Card>
          )}
        </Section>

        {/* Smart suggestion — only when there's an over-budget category */}
        {!isLoading && suggestion ? (
          <View style={{ marginTop: 16 }}>
            <Card style={{ padding: 14, flexDirection: "row", gap: 12 }} soft>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: dark ? "#1e3a8a" : Tokens.brandSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles
                  size={16}
                  color={dark ? "#bfdbfe" : Tokens.brand}
                  strokeWidth={2.2}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-fg dark:text-fg-dark text-[13.5px] font-semibold">
                  Smart suggestion
                </Text>
                <Text className="text-fg-muted dark:text-fg-dark-muted text-[12px] mt-1" style={{ lineHeight: 17 }}>
                  Based on your spending, increase your {suggestion.category} budget to{" "}
                  {formatCurrency(suggestion.next)} to avoid overshooting next month.
                </Text>
              </View>
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroCard({
  totals,
  dark,
}: {
  totals: { allocated: number; spent: number; overCount: number; pct: number };
  dark: boolean;
}) {
  const { allocated, spent, overCount, pct } = totals;
  const clampedPct = Math.min(100, pct);
  const overallStatus = statusFor(spent, allocated);
  const barColor = statusColor(overallStatus);

  return (
    <Card style={{ padding: 18, marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text
            className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase"
            style={{ letterSpacing: 0.5 }}
          >
            Spent this month
          </Text>
          <Money
            value={spent}
            className="text-fg dark:text-fg-dark text-[28px] font-bold mt-1"
            style={{ letterSpacing: -0.8 }}
          />
          <Text className="text-fg-muted dark:text-fg-dark-muted text-[12px] mt-1">
            of {formatCurrency(allocated)} budgeted
          </Text>
        </View>
        {allocated > 0 ? (
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                color: barColor,
                fontSize: 22,
                fontWeight: "700",
                fontVariant: ["tabular-nums"],
                letterSpacing: -0.4,
              }}
            >
              {pct.toFixed(0)}%
            </Text>
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[11px] mt-1">
              used
            </Text>
          </View>
        ) : null}
      </View>

      {/* Progress bar */}
      {allocated > 0 ? (
        <View
          style={{
            marginTop: 14,
            height: 8,
            borderRadius: 99,
            backgroundColor: dark ? Tokens.bgElevDark : Tokens.bgElev,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${clampedPct}%`,
              height: "100%",
              borderRadius: 99,
              backgroundColor: barColor,
            }}
          />
        </View>
      ) : null}

      {/* Over-budget alert pill */}
      {overCount > 0 ? (
        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: dark ? "#3a1320" : Tokens.roseBg,
            borderWidth: 1,
            borderColor: dark ? "#5a1d2e" : Tokens.roseSoft,
          }}
        >
          <AlertTriangle size={14} color={Tokens.rose} strokeWidth={2.2} />
          <Text
            style={{
              color: Tokens.rose,
              fontSize: 12.5,
              fontWeight: "600",
            }}
          >
            {overCount} {overCount === 1 ? "category is" : "categories are"} over budget
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function BudgetRow({
  budget,
  dark,
  last,
}: {
  budget: BudgetDoc;
  dark: boolean;
  last: boolean;
}) {
  const palette = getCategoryPalette(budget.category);
  const Icon = getCategoryIcon(budget.category);
  const status = statusFor(budget.spent, budget.allocated);
  const barColor = statusColor(status);
  const pct = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;
  const clampedPct = Math.min(100, pct);
  const remaining = budget.allocated - budget.spent;

  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: dark ? Tokens.borderDark : Tokens.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* Category icon tile */}
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

        {/* Name + spent/allocated */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            className="text-fg dark:text-fg-dark text-[14px] font-semibold"
            style={{ letterSpacing: -0.1 }}
          >
            {budget.name || budget.category}
          </Text>
          <Text
            className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-0.5"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatCurrency(budget.spent)} of {formatCurrency(budget.allocated)}
          </Text>
        </View>

        {/* Percentage + remaining */}
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              color: barColor,
              fontSize: 13,
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
            }}
          >
            {pct.toFixed(0)}%
          </Text>
          <Text
            className={status === "over" ? "text-rose" : "text-fg-muted dark:text-fg-dark-muted"}
            style={{
              fontSize: 10.5,
              marginTop: 1,
              fontVariant: ["tabular-nums"],
              fontWeight: status === "over" ? "600" : "400",
            }}
          >
            {status === "over"
              ? `over by ${formatCurrency(Math.abs(remaining))}`
              : `${formatCurrency(remaining)} left`}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={{
          marginTop: 10,
          height: 5,
          borderRadius: 99,
          backgroundColor: dark ? Tokens.bgElevDark : Tokens.bgElev,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${clampedPct}%`,
            height: "100%",
            borderRadius: 99,
            backgroundColor: barColor,
          }}
        />
      </View>
    </View>
  );
}
