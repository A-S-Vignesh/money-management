// allpages/BudgetsPage.tsx
"use client";

import { useState, useMemo } from "react";
import { useBudgets } from "@/hooks/budgets/useBudgets";
import { useAddBudget } from "@/hooks/budgets/useAddBudget";
import { useUpdateBudget } from "@/hooks/budgets/useUpdateBudget";
import { useDeleteBudget } from "@/hooks/budgets/useDeleteBudget";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { getPeriodRange } from "@/utils/getBudgetPeriod";
import { categories, categoryMap, CategoryName } from "@/utils/categories";
import {
  PieChart as RPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Period } from "@/utils/getBudgetPeriod";
import { getCategoryExpensePieData } from "@/utils/getMontlyBudget";
import {
  Plus,
  DollarSign,
  TrendingUp,
  PieChart,
  Edit,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import IBudget from "@/types/budget";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  createBudgetSchema,
  type CreateBudgetInput,
} from "@/validations/budget";

type Range = "thisMonth" | "lastMonth";

// ─── Form Errors ────────────────────────────────────────────────────────
interface FormErrors {
  name?: string[];
  category?: string[];
  allocated?: string[];
  period?: string[];
}

// ─── Skeleton Loaders ───────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
      <div className="h-7 bg-gray-200 rounded w-28" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-4 border-b border-gray-100"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function BudgetsPage() {
  // ── Pagination & filter state ─────────────────────
  const [page, setPage] = useState(1);
  const [sortPeriodBy, setSortPeriodBy] = useState("All");
  const [sortBy, setSortBy] = useState("progress");
  const limit = 10;

  // ── React Query data ──────────────────────────────
  const {
    data: budgetsData,
    isLoading: budgetsLoading,
    isError: budgetsError,
    error: budgetsErrorObj,
    refetch: refetchBudgets,
  } = useBudgets({ page, limit, period: sortPeriodBy });

  const { data: transactionsData, isLoading: transactionsLoading } =
    useTransactions();

  const budgets = budgetsData?.data ?? [];
  const pagination = budgetsData?.pagination;
  const transactions = transactionsData?.data ?? [];

  // ── Mutations ─────────────────────────────────────
  const addMutation = useAddBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  // ── UI state ──────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState<IBudget | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedRange, setSelectedRange] = useState<Range>("thisMonth");

  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#ff6384",
    "#36a2eb",
    "#4bc0c0",
    "#9966ff",
    "#c9cbcf",
    "#ffcd56",
  ];

  // ── Derived data ──────────────────────────────────
  const data = useMemo(
    () => getCategoryExpensePieData(transactions, selectedRange),
    [transactions, selectedRange],
  );
  const isEmpty = data.length === 0 || data.every((d) => d.value === 0);

  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);

  const budgetCategories = budgets.map((b) => b.category);
  const totalSpent = transactions
    .filter((txn) => budgetCategories.includes(txn.category as CategoryName))
    .reduce((sum, txn) => sum + txn.amount, 0);

  const remaining = totalAllocated - totalSpent;
  const utilization =
    totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  // Sort budgets client-side
  const sortedBudgets = [...budgets].sort((a, b) => {
    if (!a?.spent || !b?.spent || !a?.allocated || !b?.allocated) return 0;
    const aProgress = (a.spent / a.allocated) * 100;
    const bProgress = (b.spent / b.allocated) * 100;
    if (sortBy === "progress") return bProgress - aProgress;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "allocated") return b.allocated - a.allocated;
    return 0;
  });

  // ── Handlers ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData(e.currentTarget);
    const period = (formData.get("period")?.toString() as Period) || "Monthly";
    const { startDate, endDate } = getPeriodRange(period);

    const raw = {
      name: (formData.get("name")?.toString() || "").trim(),
      category: (formData.get("category")?.toString() || "") as CategoryName,
      allocated: Number(formData.get("allocated")) || 0,
      period,
      startDate,
      endDate,
    };

    // Validate with Zod
    const result = createBudgetSchema.safeParse(raw);
    if (!result.success) {
      setFormErrors(result.error.flatten().fieldErrors as FormErrors);
      return;
    }

    try {
      if (editBudget && editBudget._id) {
        await updateMutation.mutateAsync({
          id: editBudget._id,
          data: result.data,
        });
        setEditBudget(null);
      } else {
        await addMutation.mutateAsync(result.data as CreateBudgetInput);
      }
      setShowForm(false);
      setFormErrors({});
    } catch {
      // Error handled by mutation's onError
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this Budget?")) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch {
        // Error handled by mutation's onError
      }
    }
  };

  const isLoading = budgetsLoading || transactionsLoading;
  const isMutating = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Budget Management
          </h1>
          <p className="text-gray-600">Track and control your spending</p>
        </div>

        <button
          onClick={() => {
            setShowForm(true);
            setEditBudget(null);
            setFormErrors({});
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Create Budget</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Total Budget</p>
              <p className="text-xl font-bold">
                {formatCurrency(totalAllocated)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Amount Spent</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(totalSpent)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Amount Remaining</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(remaining)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Utilization</p>
              <p className="text-xl font-bold">{utilization.toFixed(1)}%</p>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Budget Overview Chart */}
        <div className="md:col-span-2 lg:col-span-2 bg-white p-6 rounded-xl shadow-sm w-full border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Budget Overview
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedRange("thisMonth")}
                className={`text-xs px-3 py-1 rounded ${
                  selectedRange === "thisMonth"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setSelectedRange("lastMonth")}
                className={`text-xs px-3 py-1 rounded ${
                  selectedRange === "lastMonth"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Last Month
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-2">
            {isEmpty ? (
              <div className="text-center mt-16 h-64 lg:h-95 flex flex-col justify-center items-center">
                <PieChart className="mx-auto text-gray-400" size={40} />
                <p className="text-gray-500 mt-2">No data available</p>
              </div>
            ) : (
              <div className="h-64 lg:h-110">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value }) =>
                        `${name}: ₹${value?.toLocaleString()}`
                      }
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => `₹${Number(val).toLocaleString()}`}
                    />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Category Distribution
          </h2>

          <div className="space-y-4">
            {categories.map((category, index) => {
              const categoryBudgets = budgets.filter(
                (b) => b.category === category.name,
              );
              const allocated = categoryBudgets.reduce(
                (sum, b) => sum + b.allocated,
                0,
              );
              const percentage =
                totalAllocated > 0 ? (allocated / totalAllocated) * 100 : 0;
              const Icon = category.icon;

              return (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <span
                        className={`w-6 h-6 ${category.color} rounded-full flex items-center justify-center mr-2`}
                      >
                        <Icon />
                      </span>
                      <span className="text-gray-600">{category.name}</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(allocated)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${category.color} h-2 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Budget Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2"></div>
          <div className="flex flex-row gap-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm text-nowrap">Period:</span>
              <div className="relative">
                <select
                  className="appearance-none pl-3 pr-8 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={sortPeriodBy}
                  onChange={(e) => {
                    setSortPeriodBy(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="All">All Periods</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
                <ChevronDown
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm text-nowrap">
                Sort by:
              </span>
              <div className="relative">
                <select
                  className="appearance-none pl-3 pr-8 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="progress">Progress</option>
                  <option value="name">Name</option>
                  <option value="allocated">Amount</option>
                </select>
                <ChevronDown
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Budgets Table ────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Error State */}
        {budgetsError && (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="mx-auto text-red-400 mb-3" size={40} />
            <p className="text-gray-600 mb-2">
              {budgetsErrorObj?.message || "Failed to load budgets"}
            </p>
            <button
              onClick={() => refetchBudgets()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading */}
        {budgetsLoading && <TableSkeleton />}

        {/* Table */}
        {!budgetsLoading && !budgetsError && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">
                    Budget
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">
                    Category
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">
                    Period
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500">
                    Allocated
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500">
                    Spent
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500">
                    Remaining
                  </th>
                  <th className="py-3 px-6 text-center text-sm font-medium text-gray-500">
                    Progress
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500">
                    Start Date
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500">
                    End Date
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedBudgets.map((budget) => {
                  const startDate = budget.startDate
                    ? new Date(budget.startDate)
                    : null;
                  const endDate = budget.endDate
                    ? new Date(budget.endDate)
                    : null;

                  // Filter transactions for this budget
                  const budgetTransactions = transactions.filter((tx) => {
                    if (!startDate || !endDate) return false;
                    return (
                      tx.category === budget.category &&
                      tx.type === "expense" &&
                      new Date(tx.date) >= startDate &&
                      new Date(tx.date) <= endDate
                    );
                  });

                  const spent = budgetTransactions.reduce(
                    (acc, tx) => acc + tx.amount,
                    0,
                  );

                  const progress = (spent / budget.allocated) * 100;
                  const isOverBudget = progress > 100;
                  const budgetRemaining = budget.allocated - spent;

                  const Icon = categoryMap[budget.category]?.icon || DollarSign;

                  return (
                    <tr key={budget._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                            <Icon />
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {budget.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {budget.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${
                            categoryMap[budget.category]?.color ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {budget.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600 capitalize">
                        {budget.period}
                      </td>
                      <td className="py-4 px-6 text-right font-medium">
                        {formatCurrency(budget.allocated)}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-red-600">
                        {formatCurrency(spent)}
                      </td>
                      <td
                        className={`py-4 px-6 text-right font-medium ${
                          budgetRemaining >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(budgetRemaining)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                isOverBudget
                                  ? "bg-red-500"
                                  : progress > 80
                                    ? "bg-amber-500"
                                    : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(progress, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-2 w-10">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-gray-600">
                          {startDate?.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-gray-600">
                          {endDate?.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end">
                          <button
                            className="p-1 text-gray-500 hover:text-indigo-600 rounded hover:bg-gray-100"
                            onClick={() => {
                              setEditBudget(budget);
                              setShowForm(true);
                              setFormErrors({});
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="p-1 text-gray-500 hover:text-red-500 rounded hover:bg-gray-100 ml-2"
                            onClick={() =>
                              budget._id && handleDelete(budget._id)
                            }
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {sortedBudgets.length === 0 && (
              <div className="py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <PieChart className="text-gray-400 mx-auto mb-4" size={40} />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No budgets found
                  </h3>
                  <p className="text-gray-500 max-w-md mb-4">
                    You haven&apos;t created any budgets yet.
                  </p>
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditBudget(null);
                      setFormErrors({});
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    <Plus size={16} />
                    <span>Create Your First Budget</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} budgets
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm font-medium text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Budget Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
          <div className="flex items-start mb-3">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <h3 className="font-medium text-blue-800">Budgeting Tip #1</h3>
          </div>
          <p className="text-blue-700">
            Review your budgets weekly to ensure you&apos;re on track. Small
            adjustments can prevent overspending.
          </p>
        </div>

        <div className="bg-green-50 p-5 rounded-xl border border-green-100">
          <div className="flex items-start mb-3">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <h3 className="font-medium text-green-800">Budgeting Tip #2</h3>
          </div>
          <p className="text-green-700">
            Allocate 20% of your income to savings and investments before
            budgeting for expenses.
          </p>
        </div>

        <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
          <div className="flex items-start mb-3">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <PieChart className="text-purple-600" size={20} />
            </div>
            <h3 className="font-medium text-purple-800">Budgeting Tip #3</h3>
          </div>
          <p className="text-purple-700">
            Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings for
            balanced budgeting.
          </p>
        </div>
      </div>

      {/* ─── Create/Edit Budget Modal ────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editBudget ? "Edit Budget" : "Create New Budget"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditBudget(null);
                    setFormErrors({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Budget Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editBudget?.name || ""}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.name
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g. Groceries, Rent"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.name[0]}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      defaultValue={editBudget?.category || ""}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.category
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.name} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.category && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.category[0]}
                      </p>
                    )}
                  </div>

                  {/* Period */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Period
                    </label>
                    <select
                      name="period"
                      defaultValue={editBudget?.period || "Monthly"}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.period
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                    {formErrors.period && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.period[0]}
                      </p>
                    )}
                  </div>

                  {/* Allocated */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allocated Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="allocated"
                      defaultValue={editBudget?.allocated || ""}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.allocated
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="0"
                      min="0"
                    />
                    {formErrors.allocated && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.allocated[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditBudget(null);
                      setFormErrors({});
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isMutating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isMutating && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {editBudget ? "Update" : "Create"} Budget
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
