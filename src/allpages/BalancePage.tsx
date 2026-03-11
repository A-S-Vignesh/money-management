// allpages/BalancePage.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAccounts } from "@/hooks/accounts/useAccounts";
import { useAddAccount } from "@/hooks/accounts/useAddAccount";
import { useUpdateAccount } from "@/hooks/accounts/useUpdateAccount";
import { useDeleteAccount } from "@/hooks/accounts/useDeleteAccount";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { generateNetWorthHistory } from "@/utils/netWorthHistory";
import { IAccount } from "@/types/account";
import Link from "next/link";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  createAccountSchema,
  type CreateAccountInput,
} from "@/validations/account";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  TrendingUp,
  Wallet,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ExportCSVButton from "@/components/ExportCSVButton";

interface NetWorthPoint {
  date: string;
  value: number;
}

type TimeRange = "week" | "month" | "year";
const ranges: TimeRange[] = ["week", "month", "year"];

type AccountType =
  | "bank"
  | "cash"
  | "credit"
  | "investment"
  | "system"
  | "goal"
  | "other";

// Calculate financial metrics
const calculateBalance = (
  accounts: IAccount[] = [],
  transactions: { type: string; amount: number }[] = [],
) => {
  const totalAssets = accounts
    .filter((a) => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = Math.abs(
    accounts
      .filter((a) => a.balance < 0)
      .reduce((sum, a) => sum + a.balance, 0),
  );

  const netWorth = totalAssets - totalLiabilities;

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const cashFlow = income - expenses;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    cashFlow,
    income,
    expenses,
  };
};

// ─── Form Validation Errors ─────────────────────────────────────────────
interface FormErrors {
  name?: string[];
  type?: string[];
  balance?: string[];
}

function validateAccountForm(formData: FormData): {
  success: boolean;
  data?: CreateAccountInput;
  errors?: FormErrors;
} {
  const raw = {
    name: (formData.get("name") as string) || "",
    type: (formData.get("type") as string) || "",
    balance: parseFloat(formData.get("balance") as string) || 0,
  };

  const result = createAccountSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as FormErrors,
    };
  }

  return { success: true, data: result.data };
}

// ─── Skeleton Loader ────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-4 border-b border-gray-100"
        >
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center mb-4">
        <div className="bg-gray-200 p-3 rounded-lg mr-4 w-11 h-11" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-6 bg-gray-200 rounded w-28" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-32" />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function BalancePage() {
  const { status } = useSession();
  const router = useRouter();

  // ── Pagination state ───────────────────────────────
  const [page, setPage] = useState(1);
  const limit = 10;

  // ── React Query data ───────────────────────────────
  const {
    data: accountsData,
    isLoading: accountsLoading,
    isError: accountsError,
    error: accountsErrorObj,
    refetch: refetchAccounts,
  } = useAccounts({ page, limit });

  const { data: transactionsData, isLoading: transactionsLoading } =
    useTransactions();

  const accounts = accountsData?.data ?? [];
  const pagination = accountsData?.pagination;
  const transactions = transactionsData?.data ?? [];

  // ── Mutations ──────────────────────────────────────
  const addAccountMutation = useAddAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();

  // ── Modal + form state ─────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editAccount, setEditAccount] = useState<IAccount | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // ── Derived data ───────────────────────────────────
  const { totalAssets, totalLiabilities, netWorth, cashFlow } =
    calculateBalance(accounts, transactions);

  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  const netWorthData: NetWorthPoint[] = (() => {
    if (!transactions.length && !accounts.length) return [];
    return generateNetWorthHistory(transactions, accounts, timeRange);
  })();

  const isPositiveCashFlow = cashFlow >= 0;

  // Group accounts by type and compute totals
  const allocationData = (() => {
    const groups: Partial<Record<AccountType, number>> = {};
    let total = 0;

    accounts.forEach((acc) => {
      if (!groups[acc.type]) groups[acc.type] = 0;
      groups[acc.type]! += acc.balance;
      total += acc.balance;
    });

    const typeColors: Record<AccountType, string> = {
      cash: "bg-yellow-500",
      bank: "bg-blue-500",
      credit: "bg-red-500",
      investment: "bg-green-500",
      system: "bg-gray-500",
      goal: "bg-purple-500",
      other: "bg-pink-500",
    };

    return Object.entries(groups).map(([type, amount]) => {
      const t = type as AccountType;
      return {
        name: t.charAt(0).toUpperCase() + t.slice(1),
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: typeColors[t] || "bg-gray-400",
      };
    });
  })();

  // ── Handlers ───────────────────────────────────────
  const handleAddAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const validation = validateAccountForm(formData);
    if (!validation.success) {
      setFormErrors(validation.errors || {});
      return;
    }

    try {
      await addAccountMutation.mutateAsync(validation.data!);
      setShowAddForm(false);
      setFormErrors({});
      form.reset();
    } catch {
      // Error handled by mutation's onError
    }
  };

  const handleEditAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const validation = validateAccountForm(formData);
    if (!validation.success) {
      setFormErrors(validation.errors || {});
      return;
    }

    try {
      if (editAccount?._id) {
        await updateAccountMutation.mutateAsync({
          id: editAccount._id,
          data: validation.data!,
        });
        setShowEditForm(false);
        setEditAccount(null);
        setFormErrors({});
        form.reset();
      }
    } catch {
      // Error handled by mutation's onError
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this account?")) {
      try {
        await deleteAccountMutation.mutateAsync(id);
      } catch {
        // Error handled by mutation's onError
      }
    }
  };

  if (status === "loading") {
    return <p className="text-gray-500">Loading session...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Overview</h1>
          <p className="text-gray-600">Your complete financial position</p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {accountsLoading || transactionsLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Net Worth Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <TrendingUp className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">
                    Net Worth
                  </h3>
                  <p className="text-2xl font-bold">
                    {formatCurrency(netWorth)}
                  </p>
                </div>
              </div>
              <div
                className={`text-sm ${
                  netWorth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {netWorth >= 0 ? "▲" : "▼"} 5.2% from last month
              </div>
            </div>

            {/* Total Assets Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <ArrowUpRight className="text-green-600" size={20} />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">
                    Total Assets
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalAssets)}
                  </p>
                </div>
              </div>
              <div className="text-sm text-green-600">
                ▲ 3.8% from last month
              </div>
            </div>

            {/* Total Liabilities Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-lg mr-4">
                  <ArrowDownRight className="text-red-600" size={20} />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">
                    Total Liabilities
                  </h3>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalLiabilities)}
                  </p>
                </div>
              </div>
              <div className="text-sm text-green-600">
                ▼ 2.1% from last month
              </div>
            </div>

            {/* Cash Flow Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div
                  className={`p-3 rounded-lg mr-4 ${
                    isPositiveCashFlow ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <DollarSign
                    className={
                      isPositiveCashFlow ? "text-green-600" : "text-red-600"
                    }
                    size={20}
                  />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">
                    Cash Flow
                  </h3>
                  <p
                    className={`text-2xl font-bold ${
                      isPositiveCashFlow ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositiveCashFlow ? "+" : "-"}
                    {formatCurrency(Math.abs(cashFlow))}
                  </p>
                </div>
              </div>
              <div
                className={`text-sm ${
                  isPositiveCashFlow ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositiveCashFlow ? "Positive" : "Negative"} this month
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Worth History Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Net Worth History
            </h2>
            <div className="flex space-x-2">
              {ranges.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`text-xs px-3 py-1 rounded ${
                    timeRange === range
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center">
            {netWorthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={netWorthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500 text-sm">No data available</div>
            )}
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Asset Allocation
            </h2>
          </div>

          <div className="space-y-4">
            {allocationData.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-medium">
                    {formatCurrency(item?.amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: `${Math.abs(item.percentage)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between">
              <span className="font-medium">Total Net Worth</span>
              <span className="font-bold">{formatCurrency(netWorth)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Accounts Section ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Accounts</h2>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAddForm(true);
                setFormErrors({});
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              <span>Add Account</span>
            </button>

            <ExportCSVButton
              data={accounts}
              filename={`accounts_${new Date().toISOString()}.csv`}
            />
          </div>
        </div>

        {/* Error State */}
        {accountsError && (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="mx-auto text-red-400 mb-3" size={40} />
            <p className="text-gray-600 mb-2">
              {accountsErrorObj?.message || "Failed to load accounts"}
            </p>
            <button
              onClick={() => refetchAccounts()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {accountsLoading && <TableSkeleton />}

        {/* Accounts Table */}
        {!accountsLoading && !accountsError && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">
                    Account
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">
                    Type
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">
                    Last Updated
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500">
                    Balance
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account._id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div
                          className={`p-3 rounded-lg mr-4 ${
                            account.type === "bank"
                              ? "bg-blue-100 text-blue-800"
                              : account.type === "investment"
                                ? "bg-green-100 text-green-800"
                                : account.type === "credit"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {account.type === "bank" ? (
                            <Wallet size={20} />
                          ) : account.type === "investment" ? (
                            <TrendingUp size={20} />
                          ) : account.type === "credit" ? (
                            <CreditCard size={20} />
                          ) : (
                            <DollarSign size={20} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {account.name}
                          </div>
                          <div className="text-sm text-gray-500">•••• 1234</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 capitalize">{account.type}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(account.updatedAt).toLocaleDateString("en-GB")}
                    </td>
                    <td
                      className={`py-4 px-6 text-right font-medium ${
                        account.balance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(account.balance)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {account.type === "system" ? (
                        <span className="text-sm text-gray-400 italic">
                          You cannot do this action
                        </span>
                      ) : account.type === "goal" ? (
                        <div className="flex justify-end">
                          <Link
                            href="/dashboard/goals"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            Go to Goals to do actions
                          </Link>
                        </div>
                      ) : account.type === "investment" ? (
                        <div className="flex justify-end">
                          <Link
                            href="/dashboard/investments"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            Go to Investments to do actions
                          </Link>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <div className="relative">
                            <button
                              className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                              onClick={() => {
                                setEditAccount(account);
                                setShowEditForm(true);
                                setFormErrors({});
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="p-1 text-gray-500 hover:text-red-500 rounded hover:bg-gray-100 ml-2"
                              onClick={() => handleDelete(account._id)}
                              disabled={deleteAccountMutation.isPending}
                            >
                              {deleteAccountMutation.isPending ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {accounts.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Wallet className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500">No accounts found</p>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setFormErrors({});
                  }}
                  className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  + Add your first account
                </button>
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
              of {pagination.total} accounts
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

      {/* ─── Recent Transactions ───────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Transactions
          </h2>
          <button
            onClick={() => router.push("/dashboard/transactions")}
            className="text-blue-600 text-sm font-medium hover:cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          {transactionsLoading ? (
            <TableSkeleton />
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">
                    Description
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">
                    Date
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">
                    Category
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[...transactions]
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  )
                  .slice(0, 5)
                  .map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div
                            className={`p-2 rounded-lg mr-3 ${
                              transaction.type === "income"
                                ? "bg-green-100"
                                : "bg-red-100"
                            }`}
                          >
                            {transaction.type === "income" ? (
                              <ArrowUpRight
                                className="text-green-600"
                                size={16}
                              />
                            ) : (
                              <ArrowDownRight
                                className="text-red-600"
                                size={16}
                              />
                            )}
                          </div>
                          {transaction.description}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(transaction.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full">
                          {transaction.category}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-6 text-right font-medium ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Add Account Modal ─────────────────────────────────────── */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Account</h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormErrors({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddAccount}>
                <div className="space-y-4">
                  {/* Account Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.name
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g. Cash, HDFC Bank, Wallet"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.name[0]}
                      </p>
                    )}
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Type
                    </label>
                    <select
                      name="type"
                      defaultValue=""
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.type
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="" disabled>
                        Select a type
                      </option>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="credit">Credit Card</option>
                      <option value="other">Other</option>
                    </select>
                    {formErrors.type && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.type[0]}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Balance (₹)
                  </label>
                  <input
                    type="number"
                    name="balance"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.balance
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  {formErrors.balance && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.balance[0]}
                    </p>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormErrors({});
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addAccountMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {addAccountMutation.isPending && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    Add Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Account Modal ────────────────────────────────────── */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Account</h2>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditAccount(null);
                    setFormErrors({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditAccount}>
                <div className="space-y-4">
                  {/* Account Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editAccount?.name || ""}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.name
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g. Cash, HDFC Bank, Wallet"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.name[0]}
                      </p>
                    )}
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Type
                    </label>
                    <select
                      name="type"
                      defaultValue={editAccount?.type || ""}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.type
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="credit">Credit Card</option>
                      <option value="other">Other</option>
                    </select>
                    {formErrors.type && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.type[0]}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Balance (₹)
                  </label>
                  <input
                    type="number"
                    name="balance"
                    defaultValue={editAccount?.balance || ""}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.balance
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  {formErrors.balance && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.balance[0]}
                    </p>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditAccount(null);
                      setFormErrors({});
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateAccountMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {updateAccountMutation.isPending && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    Update Account
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
