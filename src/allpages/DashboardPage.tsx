// allpages/DashboardPage.tsx
"use client";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart,
  CreditCard,
  DollarSign,
  PieChart,
  Search,
  Target,
  TrendingUp,
  Wallet,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { categories, type CategoryName } from "@/utils/categories";
import { formatCurrency } from "@/utils/formatCurrency";
import { useSession } from "next-auth/react";

// ─── Skeleton Components ─────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center mb-4">
        <div className="w-11 h-11 bg-gray-200 rounded-lg mr-4" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
      <div className="flex items-end justify-between">
        <div className="h-7 bg-gray-200 rounded w-28" />
        <div className="h-5 bg-gray-100 rounded w-14" />
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {userName}
        </h1>
        <p className="text-gray-600">
          Here&apos;s your financial overview for today
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Total Balance Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <Wallet className="text-blue-600" size={20} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Balance
                </h3>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold">
                  {formatCurrency(data?.totalBalance ?? 0)}
                </p>
                <span
                  className={`${
                    (data?.netChange ?? 0) >= 0
                      ? "text-green-500 bg-green-50"
                      : "text-red-500 bg-red-50"
                  } px-2 py-1 rounded text-sm`}
                >
                  {(data?.netChange ?? 0) >= 0 ? "+" : ""}
                  {formatCurrency(Math.abs(data?.netChange ?? 0))}
                </span>
              </div>
            </div>

            {/* Income Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <ArrowUpRight className="text-green-600" size={20} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Income
                </h3>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data?.totalIncome ?? 0)}
                </p>
                {data?.incomeChange !== null &&
                  data?.incomeChange !== undefined && (
                    <span
                      className={`${
                        parseFloat(data.incomeChange) >= 0
                          ? "text-green-500 bg-green-50"
                          : "text-red-500 bg-red-50"
                      } px-2 py-1 rounded text-sm`}
                    >
                      {parseFloat(data.incomeChange) >= 0 ? "+" : ""}
                      {data.incomeChange}%
                    </span>
                  )}
              </div>
            </div>

            {/* Expenses Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-lg mr-4">
                  <ArrowDownRight className="text-red-600" size={20} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Expenses
                </h3>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(data?.totalExpense ?? 0)}
                </p>
                {data?.expenseChange !== null &&
                  data?.expenseChange !== undefined && (
                    <span
                      className={`${
                        parseFloat(data.expenseChange) >= 0
                          ? "text-red-500 bg-red-50"
                          : "text-green-500 bg-green-50"
                      } px-2 py-1 rounded text-sm`}
                    >
                      {parseFloat(data.expenseChange) >= 0 ? "+" : ""}
                      {data.expenseChange}%
                    </span>
                  )}
              </div>
            </div>

            {/* Net Worth Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <TrendingUp className="text-purple-600" size={20} />
                </div>
                <h3 className="text-gray-500 text-sm font-medium">Net Worth</h3>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold">
                  {formatCurrency(data?.totalBalance ?? 0)}
                </p>
                <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded text-sm">
                  {data?.totalAccounts ?? 0} accounts
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Balance Trend
            </h2>
            <div className="flex space-x-2">
              <button className="text-xs bg-gray-100 px-3 py-1 rounded">
                Week
              </button>
              <button className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded">
                Month
              </button>
              <button className="text-xs bg-gray-100 px-3 py-1 rounded">
                Year
              </button>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart className="mx-auto text-gray-400" size={40} />
              <p className="text-gray-500 mt-2">
                Monthly balance trend visualization
              </p>
              <p className="text-gray-400 text-sm">(Chart will appear here)</p>
            </div>
          </div>
        </div>

        {/* Spending Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Spending Distribution
          </h2>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <div className="h-3 bg-gray-200 rounded w-16" />
                    <div className="h-3 bg-gray-200 rounded w-12" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2" />
                </div>
              ))}
            </div>
          ) : data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
            <div className="space-y-4">
              {data.categoryBreakdown.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600 text-sm">
                      {item.category}
                    </span>
                    <span className="font-medium text-sm">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${getCategoryBarColor(item.category)} h-2 rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <PieChart className="text-gray-300 mb-2" size={32} />
              <p className="text-gray-400 text-sm">No expense data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Goals & Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Goals */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
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
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
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
            <div className="overflow-x-auto">
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
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
