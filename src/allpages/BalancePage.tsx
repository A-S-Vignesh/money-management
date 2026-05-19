// allpages/BalancePage.tsx
"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";
import { useAccounts } from "@/hooks/accounts/useAccounts";
import { useAddAccount } from "@/hooks/accounts/useAddAccount";
import { useUpdateAccount } from "@/hooks/accounts/useUpdateAccount";
import { useDeleteAccount } from "@/hooks/accounts/useDeleteAccount";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { IAccount } from "@/types/account";
import Link from "next/link";
import { formatCurrency } from "@/utils/formatCurrency";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
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
  Cell,
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
  RefreshCw,
} from "lucide-react";
import ExportCSVButton from "@/components/ExportCSVButton";

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
          className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800"
        >
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
      <div className="flex items-center mb-4">
        <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg mr-4 w-11 h-11" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-32" />
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
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // ── Derived data ───────────────────────────────────
  const { totalAssets, totalLiabilities, netWorth, cashFlow } =
    calculateBalance(accounts, transactions);

  const isPositiveCashFlow = cashFlow >= 0;

  // Per-account balance data for the chart — top accounts by absolute balance,
  // excluding system accounts. Color is asset (positive) vs liability (negative).
  const accountBalanceData = useMemo(() => {
    return accounts
      .filter((a) => a.type !== "system" && a.name !== "Deleted Account")
      .map((a) => ({
        name: a.name.length > 14 ? `${a.name.slice(0, 14)}…` : a.name,
        fullName: a.name,
        balance: a.balance,
        type: a.type,
        isAsset: a.balance >= 0,
      }))
      .sort((x, y) => Math.abs(y.balance) - Math.abs(x.balance))
      .slice(0, 8);
  }, [accounts]);

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

  // ── Recompute balances ─────────────────────────────
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  const [isRecomputing, setIsRecomputing] = useState(false);

  const handleRecompute = async () => {
    setIsRecomputing(true);
    try {
      const res = await fetch("/api/accounts/recompute-all", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to recompute balances");
      }
      showToast(json.message, "success");
      // Refresh anything that depends on balances
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to recompute balances",
        "error",
      );
    } finally {
      setIsRecomputing(false);
    }
  };

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

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    try {
      await deleteAccountMutation.mutateAsync(accountToDelete);
      setAccountToDelete(null);
    } catch {
      // Error handled by mutation's onError
    }
  };

  if (status === "loading") {
    return <p className="text-gray-500 dark:text-gray-400">Loading session...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Balance Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">Your complete financial position</p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
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
            <div className="bg-white dark:bg-gray-900 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
              <div className="flex items-center mb-2 md:mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 md:p-3 rounded-lg mr-2 md:mr-4">
                  <TrendingUp className="text-blue-600 dark:text-blue-300 w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium truncate">
                    Net Worth
                  </h3>
                  <p className="text-base md:text-2xl font-bold truncate">
                    {formatCurrency(netWorth)}
                  </p>
                </div>
              </div>
              <div
                className={`text-[10px] md:text-sm truncate ${
                  netWorth >= 0 ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"
                }`}
              >
                {netWorth >= 0 ? "▲" : "▼"} 5.2% from last month
              </div>
            </div>

            {/* Total Assets Card */}
            <div className="bg-white dark:bg-gray-900 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
              <div className="flex items-center mb-2 md:mb-4">
                <div className="bg-green-100 dark:bg-green-900/40 p-2 md:p-3 rounded-lg mr-2 md:mr-4">
                  <ArrowUpRight className="text-green-600 dark:text-green-300 w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium truncate">
                    Total Assets
                  </h3>
                  <p className="text-base md:text-2xl font-bold text-green-600 dark:text-green-300 truncate">
                    {formatCurrency(totalAssets)}
                  </p>
                </div>
              </div>
              <div className="text-[10px] md:text-sm text-green-600 dark:text-green-300 truncate">
                ▲ 3.8% from last month
              </div>
            </div>

            {/* Total Liabilities Card */}
            <div className="bg-white dark:bg-gray-900 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
              <div className="flex items-center mb-2 md:mb-4">
                <div className="bg-red-100 dark:bg-red-900/40 p-2 md:p-3 rounded-lg mr-2 md:mr-4">
                  <ArrowDownRight className="text-red-600 dark:text-red-300 w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium truncate">
                    Total Liabilities
                  </h3>
                  <p className="text-base md:text-2xl font-bold text-red-600 dark:text-red-300 truncate">
                    {formatCurrency(totalLiabilities)}
                  </p>
                </div>
              </div>
              <div className="text-[10px] md:text-sm text-green-600 dark:text-green-300 truncate">
                ▼ 2.1% from last month
              </div>
            </div>

            {/* Cash Flow Card */}
            <div className="bg-white dark:bg-gray-900 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
              <div className="flex items-center mb-2 md:mb-4">
                <div
                  className={`p-2 md:p-3 rounded-lg mr-2 md:mr-4 ${
                    isPositiveCashFlow ? "bg-green-100 dark:bg-green-900/40" : "bg-red-100 dark:bg-red-900/40"
                  }`}
                >
                  <DollarSign
                    className={`w-4 h-4 md:w-5 md:h-5 ${
                      isPositiveCashFlow ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium truncate">
                    Cash Flow
                  </h3>
                  <p
                    className={`text-base md:text-2xl font-bold truncate ${
                      isPositiveCashFlow ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"
                    }`}
                  >
                    {isPositiveCashFlow ? "+" : "-"}
                    {formatCurrency(Math.abs(cashFlow))}
                  </p>
                </div>
              </div>
              <div
                className={`text-[10px] md:text-sm truncate ${
                  isPositiveCashFlow ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"
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
        {/* Account Balances Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Account Balances
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Top {accountBalanceData.length} accounts by balance size
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Asset
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
                Liability
              </span>
            </div>
          </div>

          {accountsLoading ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg h-72 animate-pulse" />
          ) : accountBalanceData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={accountBalanceData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  barCategoryGap={10}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f3f4f6"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v: number) =>
                      Math.abs(v) >= 1000
                        ? `${(v / 1000).toFixed(1)}k`
                        : `${v}`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#374151" }}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: "#f9fafb" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                    }}
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Balance",
                    ]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName || ""
                    }
                  />
                  <Bar dataKey="balance" radius={[0, 6, 6, 0]}>
                    {accountBalanceData.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={entry.isAsset ? "#10b981" : "#f43f5e"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg h-72 flex flex-col items-center justify-center">
              <Wallet className="text-gray-400 dark:text-gray-500 mb-2" size={36} />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No accounts to chart yet</p>
            </div>
          )}
        </div>

        {/* Asset Allocation */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Asset Allocation
            </h2>
          </div>

          <div className="space-y-4">
            {allocationData.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                  <span className="font-medium">
                    {formatCurrency(item?.amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: `${Math.abs(item.percentage)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-between">
              <span className="font-medium">Total Net Worth</span>
              <span className="font-bold">{formatCurrency(netWorth)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Accounts Section ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Accounts</h2>

          <div className="flex gap-2 md:gap-3">
            <button
              onClick={handleRecompute}
              disabled={isRecomputing}
              title="Recalculate every account's balance from its transactions"
              className="flex items-center gap-2 px-3 md:px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              <RefreshCw
                size={16}
                className={isRecomputing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">
                {isRecomputing ? "Recomputing…" : "Recompute"}
              </span>
            </button>

            <button
              onClick={() => {
                setShowAddForm(true);
                setFormErrors({});
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              <span>Add</span>
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
            <p className="text-gray-600 dark:text-gray-400 mb-2">
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
            {/* Desktop Table View */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Type
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Updated
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                    Balance
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div
                          className={`p-3 rounded-lg mr-4 ${
                            account.type === "bank"
                              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                              : account.type === "investment"
                                ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200"
                                : account.type === "credit"
                                  ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"
                                  : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200"
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
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {account.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">•••• 1234</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 capitalize">{account.type}</td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                      {new Date(account.updatedAt).toLocaleDateString("en-GB")}
                    </td>
                    <td
                      className={`py-4 px-6 text-right font-medium ${
                        account.balance >= 0 ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"
                      }`}
                    >
                      {formatCurrency(account.balance)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {account.type === "system" ? (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">
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
                              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={() => {
                                setEditAccount(account);
                                setShowEditForm(true);
                                setFormErrors({});
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ml-2"
                              onClick={() => setAccountToDelete(account._id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile List View */}
            {accounts.length > 0 && (
              <div className="md:hidden divide-y divide-gray-50 border-t border-gray-100 dark:border-gray-800">
                {accounts.map((account) => (
                  <div key={account._id} className="p-4 bg-white dark:bg-gray-900">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl flex-shrink-0 ${
                            account.type === "bank"
                              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                              : account.type === "investment"
                                ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200"
                                : account.type === "credit"
                                  ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"
                                  : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200"
                          }`}
                        >
                          {account.type === "bank" ? (
                            <Wallet size={18} />
                          ) : account.type === "investment" ? (
                            <TrendingUp size={18} />
                          ) : account.type === "credit" ? (
                            <CreditCard size={18} />
                          ) : (
                            <DollarSign size={18} />
                          )}
                        </div>
                        <div className="min-w-0 pr-2">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                            {account.name}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 capitalize mt-0.5 truncate">
                            {account.type} •••• 1234
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className={`font-semibold text-sm ${
                            account.balance >= 0 ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"
                          }`}
                        >
                          {formatCurrency(account.balance)}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(account.updatedAt).toLocaleDateString("en-GB")}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex justify-end pt-3 mt-1 border-t border-gray-50">
                      {account.type === "system" ? (
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                          System account
                        </span>
                      ) : account.type === "goal" ? (
                        <Link
                          href="/dashboard/goals"
                          className="text-[12px] text-blue-500 font-medium"
                        >
                          Go to Goals
                        </Link>
                      ) : account.type === "investment" ? (
                        <Link
                          href="/dashboard/investments"
                          className="text-[12px] text-blue-500 font-medium"
                        >
                          Go to Investments
                        </Link>
                      ) : (
                        <div className="flex gap-4">
                          <button
                            className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 hover:text-gray-700 dark:hover:text-gray-200 text-[12px] font-medium"
                            onClick={() => {
                              setEditAccount(account);
                              setShowEditForm(true);
                              setFormErrors({});
                            }}
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            className="text-red-500 dark:text-red-400 flex items-center gap-1.5 hover:text-red-700 text-[12px] font-medium"
                            onClick={() => setAccountToDelete(account._id)}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {accounts.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Wallet className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500 dark:text-gray-400">No accounts found</p>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setFormErrors({});
                  }}
                  className="mt-3 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 text-sm font-medium"
                >
                  + Add your first account
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} accounts
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Recent Transactions ───────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Recent Transactions
          </h2>
          <button
            onClick={() => router.push("/dashboard/transactions")}
            className="text-blue-600 dark:text-blue-300 text-sm font-medium hover:cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          {transactionsLoading ? (
            <TableSkeleton />
          ) : (
            <>
            {/* Desktop Table View */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Description
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Category
                  </th>
                  <th className="py-3 px-6 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
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
                    <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div
                            className={`p-2 rounded-lg mr-3 ${
                              transaction.type === "income"
                                ? "bg-green-100 dark:bg-green-900/40"
                                : "bg-red-100 dark:bg-red-900/40"
                            }`}
                          >
                            {transaction.type === "income" ? (
                              <ArrowUpRight
                                className="text-green-600 dark:text-green-300"
                                size={16}
                              />
                            ) : (
                              <ArrowDownRight
                                className="text-red-600 dark:text-red-300"
                                size={16}
                              />
                            )}
                          </div>
                          {transaction.description}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs px-2.5 py-1 rounded-full">
                          {transaction.category}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-6 text-right font-medium ${
                          transaction.type === "income"
                            ? "text-green-600 dark:text-green-300"
                            : "text-red-600 dark:text-red-300"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-gray-50 border-t border-gray-100 dark:border-gray-800">
              {[...transactions]
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .slice(0, 5)
                .map((transaction) => (
                  <div key={transaction._id} className="p-4 bg-white dark:bg-gray-900 flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div
                        className={`p-2.5 rounded-xl flex-shrink-0 ${
                          transaction.type === "income"
                            ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUpRight size={16} />
                        ) : (
                          <ArrowDownRight size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight truncate">
                          {transaction.description || "No description"}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {transaction.category} • {new Date(transaction.date).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`font-semibold text-sm flex-shrink-0 ${
                        transaction.type === "income" ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Add Account Modal ─────────────────────────────────────── */}
      {showAddForm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[200] md:p-4">
          <div className="bg-white dark:bg-gray-900 w-full md:max-w-md rounded-t-[2rem] md:rounded-2xl shadow-2xl animate-slide-up md:animate-none flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-4 mb-2 md:hidden"></div>
            <div className="flex justify-between items-center px-6 pt-2 md:pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Account</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormErrors({});
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain no-scrollbar pb-safe">
              <form onSubmit={handleAddAccount} className="p-6">
                <div className="space-y-4">
                  {/* Account Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      className={`w-full px-4 py-2 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.name
                          ? "border-red-300 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                      placeholder="e.g. Cash, HDFC Bank, Wallet"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                        {formErrors.name[0]}
                      </p>
                    )}
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account Type
                    </label>
                    <select
                      name="type"
                      defaultValue=""
                      className={`w-full px-4 py-2 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.type
                          ? "border-red-300 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <option value="" disabled>
                        Select a type
                      </option>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="credit">Credit Card</option>
                      <option value="investment">Investment</option>
                      <option value="other">Other</option>
                    </select>
                    {formErrors.type && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                        {formErrors.type[0]}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Initial Balance (₹)
                  </label>
                  <input
                    type="number"
                    name="balance"
                    className={`w-full px-4 py-2 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.balance
                        ? "border-red-300 bg-red-50 dark:bg-red-950/30"
                        : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  {formErrors.balance && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                      {formErrors.balance[0]}
                    </p>
                  )}
                </div>
                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormErrors({});
                    }}
                    className="flex-1 px-4 py-3 md:py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addAccountMutation.isPending}
                    className="flex-1 px-4 py-3 md:py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
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
        </div>,
        document.body
      )}

      {/* ─── Edit Account Modal ────────────────────────────────────── */}
      {showEditForm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[200] md:p-4">
          <div className="bg-white dark:bg-gray-900 w-full md:max-w-md rounded-t-[2rem] md:rounded-2xl shadow-2xl animate-slide-up md:animate-none flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-4 mb-2 md:hidden"></div>
            <div className="flex justify-between items-center px-6 pt-2 md:pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Account</h2>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditAccount(null);
                  setFormErrors({});
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain no-scrollbar pb-safe">
              <form onSubmit={handleEditAccount} className="p-6">
                <div className="space-y-4">
                  {/* Account Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editAccount?.name || ""}
                      className={`w-full px-4 py-2 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.name
                          ? "border-red-300 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                      placeholder="e.g. Cash, HDFC Bank, Wallet"
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                        {formErrors.name[0]}
                      </p>
                    )}
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account Type
                    </label>
                    <select
                      name="type"
                      defaultValue={editAccount?.type || ""}
                      className={`w-full px-4 py-2 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.type
                          ? "border-red-300 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="credit">Credit Card</option>
                      <option value="investment">Investment</option>
                      <option value="other">Other</option>
                    </select>
                    {formErrors.type && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                        {formErrors.type[0]}
                      </p>
                    )}
                  </div>
                </div>
                  {/* Balance — read-only, derived from transactions */}
                  <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Balance</p>
                    <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(editAccount?.balance ?? 0)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Balance is calculated from your transactions and cannot be edited directly.
                    </p>
                  </div>
                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditAccount(null);
                      setFormErrors({});
                    }}
                    className="flex-1 px-4 py-3 md:py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateAccountMutation.isPending}
                    className="flex-1 px-4 py-3 md:py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
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
        </div>,
        document.body
      )}

      {/* ─── Delete Account Modal ────────────────────────────────────── */}
      <DeleteConfirmationModal
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        description="Are you sure you want to delete this account and its associated data?"
        isLoading={deleteAccountMutation.isPending}
      />
    </div>
  );
}
