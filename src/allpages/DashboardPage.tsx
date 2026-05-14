// allpages/DashboardPage.tsx
"use client";
import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  PieChart,
  Search,
  Target,
  TrendingUp,
  Wallet,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import { categories } from "@/utils/categories";
import { formatCurrency } from "@/utils/formatCurrency";
import { useSession } from "next-auth/react";

// ─── Skeleton Components ─────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center mb-3 md:mb-4">
        <div className="w-9 h-9 md:w-11 md:h-11 bg-gray-200 rounded-lg md:mr-4 mb-2 md:mb-0" />
        <div className="h-3 bg-gray-200 rounded w-20 md:w-24" />
      </div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div className="h-6 md:h-7 bg-gray-200 rounded w-20 md:w-28" />
        <div className="h-4 md:h-5 bg-gray-100 rounded w-12 md:w-14" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-4 border-b border-gray-100"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      {[...Array(3)].map((_, i) => (
        <div key={i}>
          <div className="flex justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5" />
        </div>
      ))}
    </div>
  );
}

// ─── Helper for category color ───────────────────────────────────────
const getCategoryBarColor = (categoryName: string): string => {
  const cat = categories.find((c) => c.name === categoryName);
  if (!cat) return "bg-gray-400";
  // Extract bg color class from the combined color string e.g. "bg-red-100 text-red-800" → "bg-red-500"
  const parts = cat.color.split(" ");
  const bgPart = parts[0]; // e.g. "bg-red-100"
  return bgPart.replace("100", "500");
};

// Hex palette aligned with the category list for pie slices
const CATEGORY_HEX: Record<string, string> = {
  Food: "#ef4444",
  Housing: "#3b82f6",
  Transport: "#22c55e",
  Lifestyle: "#a855f7",
  Shopping: "#eab308",
  Learning: "#6366f1",
  Personal: "#ec4899",
  Salary: "#10b981",
  Transfer: "#94a3b8",
  Other: "#6b7280",
};
const FALLBACK_HEX = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#06b6d4"];

// ─── Main Component ──────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading, isError, error, refetch } = useDashboard();

  const userName = session?.user?.name?.split(" ")[0] || "User";

  // ── Error State ──────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Failed to load dashboard
        </h2>
        <p className="text-gray-500 mb-4">
          {(error as Error)?.message || "Something went wrong"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const monthLabel =
    data?.monthLabel ||
    new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  // Trend data — only render points up to today so the cumulative net line stops at "now"
  const trendData = useMemo(
    () =>
      (data?.monthlyTrend ?? []).map((p) => ({
        label: p.label,
        income: p.income,
        expense: p.expense,
        net: p.net,
      })),
    [data?.monthlyTrend],
  );
  const trendHasActivity = useMemo(
    () => trendData.some((p) => p.income > 0 || p.expense > 0),
    [trendData],
  );

  // Pie slices for the spending distribution chart
  const pieData = useMemo(
    () =>
      (data?.categoryBreakdown ?? []).map((item, idx) => ({
        name: item.category,
        value: item.amount,
        color:
          CATEGORY_HEX[item.category] ||
          FALLBACK_HEX[idx % FALLBACK_HEX.length],
      })),
    [data?.categoryBreakdown],
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {userName}
        </h1>
        <p className="text-gray-600">
          Your snapshot for{" "}
          <span className="font-medium text-gray-800">{monthLabel}</span>
        </p>
      </div>

      {/* First-run welcome checklist (auto-hides when complete or dismissed) */}
      {data?.onboarding && <OnboardingChecklist state={data.onboarding} />}

      {/* Summary Cards — Current Month */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Month Income Card */}
            <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center mb-3 md:mb-4">
                <div className="bg-green-100 p-2 md:p-3 rounded-lg md:mr-4 w-fit mb-2 md:mb-0">
                  <ArrowUpRight className="text-green-600 w-5 h-5 md:w-5 md:h-5" />
                </div>
                <h3 className="text-gray-500 text-xs md:text-sm font-medium">
                  Income This Month
                </h3>
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 md:gap-0">
                <p className="text-lg md:text-2xl font-bold text-green-600 truncate">
                  {formatCurrency(data?.monthIncome ?? 0)}
                </p>
                {data?.incomeChange !== null &&
                  data?.incomeChange !== undefined && (
                    <span
                      className={`${
                        parseFloat(data.incomeChange) >= 0
                          ? "text-green-500 bg-green-50"
                          : "text-red-500 bg-red-50"
                      } px-2 py-0.5 md:py-1 rounded text-[10px] md:text-sm w-fit font-medium`}
                    >
                      {parseFloat(data.incomeChange) >= 0 ? "+" : ""}
                      {data.incomeChange}%
                    </span>
                  )}
              </div>
            </div>

            {/* Month Expenses Card */}
            <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center mb-3 md:mb-4">
                <div className="bg-red-100 p-2 md:p-3 rounded-lg md:mr-4 w-fit mb-2 md:mb-0">
                  <ArrowDownRight className="text-red-600 w-5 h-5 md:w-5 md:h-5" />
                </div>
                <h3 className="text-gray-500 text-xs md:text-sm font-medium">
                  Spent This Month
                </h3>
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 md:gap-0">
                <p className="text-lg md:text-2xl font-bold text-red-600 truncate">
                  {formatCurrency(data?.monthExpense ?? 0)}
                </p>
                {data?.expenseChange !== null &&
                  data?.expenseChange !== undefined && (
                    <span
                      className={`${
                        parseFloat(data.expenseChange) >= 0
                          ? "text-red-500 bg-red-50"
                          : "text-green-500 bg-green-50"
                      } px-2 py-0.5 md:py-1 rounded text-[10px] md:text-sm w-fit font-medium`}
                    >
                      {parseFloat(data.expenseChange) >= 0 ? "+" : ""}
                      {data.expenseChange}%
                    </span>
                  )}
              </div>
            </div>

            {/* Month Net Card */}
            <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center mb-3 md:mb-4">
                <div className="bg-blue-100 p-2 md:p-3 rounded-lg md:mr-4 w-fit mb-2 md:mb-0">
                  <TrendingUp className="text-blue-600 w-5 h-5 md:w-5 md:h-5" />
                </div>
                <h3 className="text-gray-500 text-xs md:text-sm font-medium">
                  Net Saved
                </h3>
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 md:gap-0">
                <p
                  className={`text-lg md:text-2xl font-bold truncate ${
                    (data?.monthNet ?? 0) >= 0
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                >
                  {(data?.monthNet ?? 0) >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(data?.monthNet ?? 0))}
                </p>
                <span className="text-gray-500 bg-gray-50 px-2 py-0.5 md:py-1 rounded text-[10px] md:text-sm w-fit font-medium">
                  {data?.savingsRate ?? "0"}% rate
                </span>
              </div>
            </div>

            {/* Net Worth Card */}
            <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center mb-3 md:mb-4">
                <div className="bg-purple-100 p-2 md:p-3 rounded-lg md:mr-4 w-fit mb-2 md:mb-0">
                  <Wallet className="text-purple-600 w-5 h-5 md:w-5 md:h-5" />
                </div>
                <h3 className="text-gray-500 text-xs md:text-sm font-medium truncate">
                  Net Worth
                </h3>
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 md:gap-0">
                <p className="text-lg md:text-2xl font-bold truncate">
                  {formatCurrency(data?.totalBalance ?? 0)}
                </p>
                <span className="text-gray-500 bg-gray-50 px-2 py-0.5 md:py-1 rounded text-[10px] md:text-sm w-fit font-medium truncate">
                  {data?.totalAccounts ?? 0} acc
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Daily Cash Flow — Current Month */}
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Daily Cash Flow
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Cumulative net for {monthLabel}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                Income
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                Expense
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
                Net
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-gray-50 rounded-lg h-56 md:h-64 animate-pulse" />
          ) : trendData.length > 0 && trendHasActivity ? (
            <div className="h-56 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v: number) =>
                      Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
                    }
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                    }}
                    labelFormatter={(label) => `Day ${label}`}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name.charAt(0).toUpperCase() + name.slice(1),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#expenseGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#netGradient)"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg h-56 md:h-64 flex items-center justify-center">
              <div className="text-center p-4">
                <TrendingUp className="mx-auto text-gray-400" size={40} />
                <p className="text-gray-500 mt-2 text-sm md:text-base">
                  No activity yet this month
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Spending Distribution — Pie + List */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Spending Distribution
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{monthLabel}</p>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-40 bg-gray-100 rounded-lg" />
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <div className="h-3 bg-gray-200 rounded w-16" />
                    <div className="h-3 bg-gray-200 rounded w-12" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2" />
                </div>
              ))}
            </div>
          ) : pieData.length > 0 ? (
            <>
              <div className="h-44 md:h-48 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`slice-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {data!.categoryBreakdown.slice(0, 4).map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 text-sm">
                        {item.category}
                      </span>
                      <span className="font-medium text-sm">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`${getCategoryBarColor(item.category)} h-1.5 rounded-full transition-all`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <PieChart className="text-gray-300 mb-2" size={32} />
              <p className="text-gray-400 text-sm">
                No expenses this month yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Goals & Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Financial Goals */}
        <div className="lg:col-span-1 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Financial Goals
            </h2>
            <Link
              href={"/dashboard/goals"}
              className="text-blue-600 text-sm font-medium"
            >
              See all
            </Link>
          </div>

          {isLoading ? (
            <GoalsSkeleton />
          ) : data?.goals && data.goals.length > 0 ? (
            <div className="space-y-5">
              {data.goals.slice(0, 4).map((goal) => {
                const progress = Math.min(
                  100,
                  goal.target > 0 ? (goal.current / goal.target) * 100 : 0,
                );

                return (
                  <div key={goal._id}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-gray-600 text-sm">
                        {formatCurrency(goal.current)}/{" "}
                        {formatCurrency(goal.target)}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: goal.color || "#3B82F6",
                        }}
                      ></div>
                    </div>

                    <p className="text-right text-sm text-gray-500 mt-1">
                      {progress.toFixed(0)}% completed
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <Target className="text-gray-400 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No goals found
              </h3>
              <p className="text-gray-500 max-w-md mb-2 text-center text-sm">
                You haven&apos;t set any financial goals yet.
              </p>
              <Link
                href="/dashboard/goals"
                className="text-blue-600 text-sm font-medium"
              >
                Create a goal →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Transactions
            </h2>
            <Link
              href={"/dashboard/transactions"}
              className="text-blue-600 text-sm font-medium flex items-center"
            >
              View All
              <ArrowUpRight className="ml-1" size={16} />
            </Link>
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-500 text-left border-b">
                      <th className="pb-3 text-sm font-medium">Type</th>
                      <th className="pb-3 text-sm font-medium">Date</th>
                      <th className="pb-3 text-sm font-medium">Category</th>
                      <th className="pb-3 text-right text-sm font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentTransactions &&
                    data.recentTransactions.length > 0 ? (
                      data.recentTransactions.map((transaction) => (
                        <tr
                          key={transaction._id}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4">
                            <div className="flex items-center">
                              <div
                                className={`p-2 rounded-lg mr-3 ${
                                  transaction.type === "income"
                                    ? "bg-green-100"
                                    : transaction.type === "expense"
                                      ? "bg-red-100"
                                      : "bg-blue-100"
                                }`}
                              >
                                {transaction.type === "income" ? (
                                  <ArrowUpRight
                                    className="text-green-600"
                                    size={16}
                                  />
                                ) : transaction.type === "expense" ? (
                                  <ArrowDownRight
                                    className="text-red-600"
                                    size={16}
                                  />
                                ) : (
                                  <DollarSign
                                    className="text-blue-600"
                                    size={16}
                                  />
                                )}
                              </div>
                              <span className="text-sm">
                                {transaction.description}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 text-gray-600 text-sm">
                            {new Date(transaction.date).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>

                          <td className="py-4">
                            <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full">
                              {transaction.category}
                            </span>
                          </td>
                          <td
                            className={`py-4 text-right font-medium ${
                              transaction.type === "income"
                                ? "text-green-600"
                                : transaction.type === "expense"
                                  ? "text-red-600"
                                  : "text-blue-600"
                            }`}
                          >
                            {transaction.type === "income"
                              ? "+"
                              : transaction.type === "expense"
                                ? "-"
                                : ""}
                            {formatCurrency(transaction.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Search
                              className="text-gray-400 mx-auto mb-4"
                              size={40}
                            />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              No transactions found
                            </h3>
                            <p className="text-gray-500 max-w-md">
                              Start adding transactions to see them here
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden space-y-4">
                {data?.recentTransactions &&
                data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((transaction) => {
                    const isIncome = transaction.type === "income";
                    const isExpense = transaction.type === "expense";
                    return (
                      <div
                        key={transaction._id}
                        className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div
                            className={`p-3 rounded-xl mr-3 ${
                              isIncome
                                ? "bg-green-100"
                                : isExpense
                                  ? "bg-red-100"
                                  : "bg-blue-100"
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="text-green-600" size={18} />
                            ) : isExpense ? (
                              <ArrowDownRight className="text-red-600" size={18} />
                            ) : (
                              <DollarSign className="text-blue-600" size={18} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm mb-0.5 line-clamp-1">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                }
                              )}
                              {" • "}
                              {transaction.category}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`font-bold text-sm text-right shrink-0 pl-3 ${
                            isIncome
                              ? "text-green-600"
                              : isExpense
                                ? "text-red-600"
                                : "text-blue-600"
                          }`}
                        >
                          {isIncome ? "+" : isExpense ? "-" : ""}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center bg-gray-50 rounded-xl">
                    <Search className="text-gray-400 mx-auto mb-3" size={32} />
                    <h3 className="text-base font-medium text-gray-900 mb-1">
                      No transactions
                    </h3>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 animate-pulse p-6 rounded-xl h-24"
              />
            ))}
          </>
        ) : (
          <>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Active Budgets</p>
                  <p className="text-2xl font-bold mt-1">
                    {data?.activeBudgets ?? 0}
                  </p>
                </div>
                <PieChart className="text-white opacity-80" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Savings Rate</p>
                  <p className="text-2xl font-bold mt-1">
                    {data?.savingsRate ?? "0"}%
                  </p>
                </div>
                <TrendingUp className="text-white opacity-80" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Active Goals</p>
                  <p className="text-2xl font-bold mt-1">
                    {data?.totalGoals ?? 0}
                  </p>
                </div>
                <Target className="text-white opacity-80" size={32} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
