// app/(tabs)/index.tsx — Dashboard
// Wired to the same GET /api/dashboard the web app uses. Headline cards +
// a slim Recent Transactions list as the visual template for other screens.

import { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownRight, ArrowUpRight, Wallet, Target } from "lucide-react-native";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { getCategoryPalette } from "@money-nest/shared";

// Shape from src/app/api/dashboard/route.ts — kept loose; the screen
// only renders fields it cares about.
interface DashboardPayload {
  totalBalance?: number;
  totalIncome?: number;
  totalExpense?: number;
  monthIncome?: number;
  monthExpense?: number;
  totalGoals?: number;
  activeBudgets?: number;
  recentTransactions?: Array<{
    _id: string;
    description: string;
    category: string;
    amount: number;
    type: "income" | "expense" | "transfer";
    date: string;
  }>;
}

export default function DashboardScreen() {
  const user = useAuth((s) => s.user);

  const { data, isLoading, isRefetching, refetch, error } =
    useQuery<DashboardPayload>({
      queryKey: ["dashboard"],
      queryFn: () => api<DashboardPayload>("/api/dashboard"),
    });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const recent = data?.recentTransactions ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
      >
        {/* Greeting */}
        <View className="mb-5">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back
          </Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {user?.name?.split(" ")[0] ?? "Friend"}
          </Text>
        </View>

        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-2xl p-4">
            <Text className="text-red-700 dark:text-red-200 font-medium">
              Couldn't load dashboard
            </Text>
            <Text className="text-red-600/90 dark:text-red-300/90 text-sm mt-1">
              {(error as Error).message}
            </Text>
          </View>
        ) : (
          <>
            {/* Stat cards */}
            <View className="flex-row flex-wrap -mx-1.5 mb-5">
              <StatCard
                label="Net Worth"
                value={formatCurrency(data?.totalBalance ?? 0)}
                tone="indigo"
                Icon={Wallet}
              />
              <StatCard
                label="Income (Month)"
                value={formatCurrency(data?.monthIncome ?? 0)}
                tone="green"
                Icon={ArrowDownRight}
              />
              <StatCard
                label="Expense (Month)"
                value={formatCurrency(data?.monthExpense ?? 0)}
                tone="red"
                Icon={ArrowUpRight}
              />
              <StatCard
                label="Active Goals"
                value={String(data?.totalGoals ?? 0)}
                tone="amber"
                Icon={Target}
              />
            </View>

            {/* Recent transactions */}
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <View className="p-4 border-b border-gray-100 dark:border-gray-800">
                <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Recent Transactions
                </Text>
              </View>
              {recent.length === 0 ? (
                <Text className="text-sm text-gray-500 dark:text-gray-400 px-4 py-8 text-center">
                  Nothing yet. Add your first transaction.
                </Text>
              ) : (
                recent.slice(0, 6).map((tx) => (
                  <Row key={tx._id} tx={tx} />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  tone: "indigo" | "green" | "red" | "amber";
  Icon: React.ComponentType<{ size: number; color: string }>;
}) {
  const tonePill = {
    indigo: "bg-indigo-100 dark:bg-indigo-900/40",
    green: "bg-green-100 dark:bg-green-900/40",
    red: "bg-red-100 dark:bg-red-900/40",
    amber: "bg-amber-100 dark:bg-amber-900/40",
  }[tone];
  const toneIcon = {
    indigo: "#6366f1",
    green: "#22c55e",
    red: "#ef4444",
    amber: "#f59e0b",
  }[tone];

  return (
    <View className="w-1/2 px-1.5 mb-3">
      <View className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
        <View className={`${tonePill} w-9 h-9 rounded-xl items-center justify-center mb-3`}>
          <Icon size={18} color={toneIcon} />
        </View>
        <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </Text>
        <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {value}
        </Text>
      </View>
    </View>
  );
}

function Row({
  tx,
}: {
  tx: {
    _id: string;
    description: string;
    category: string;
    amount: number;
    type: "income" | "expense" | "transfer";
  };
}) {
  const palette = getCategoryPalette(tx.category);
  const sign = tx.type === "expense" ? "-" : tx.type === "income" ? "+" : "";
  const amountColor =
    tx.type === "expense"
      ? "text-red-600 dark:text-red-300"
      : tx.type === "income"
        ? "text-green-600 dark:text-green-300"
        : "text-blue-600 dark:text-blue-300";

  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-50 dark:border-gray-900 last:border-0">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: palette.bgLight }}
      >
        <Text className="text-xs font-bold" style={{ color: palette.textLight }}>
          {tx.category.slice(0, 1)}
        </Text>
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-medium text-gray-900 dark:text-gray-100" numberOfLines={1}>
          {tx.description}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {tx.category}
        </Text>
      </View>
      <Text className={`text-sm font-semibold ${amountColor}`}>
        {sign}
        {formatCurrency(tx.amount)}
      </Text>
    </View>
  );
}
