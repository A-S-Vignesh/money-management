// allpages/TransactionsPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTransactionsPaginated } from "@/hooks/transactions/useTransactionsPaginated";
import { useAddTransaction } from "@/hooks/transactions/useAddTransaction";
import { useUpdateTransaction } from "@/hooks/transactions/useUpdateTransaction";
import { useDeleteTransaction } from "@/hooks/transactions/useDeleteTransaction";
import { useAccounts } from "@/hooks/accounts/useAccounts";
import ExportCSVButton from "@/components/ExportCSVButton";
import { categories, CategoryName } from "@/utils/categories";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
} from "lucide-react";
import { ITransaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  createTransactionSchema,
  type CreateTransactionInput,
} from "@/validations/transaction";

// ─── Form Errors ────────────────────────────────────────────────────────
interface FormErrors {
  description?: string[];
  amount?: string[];
  date?: string[];
  category?: string[];
  type?: string[];
  fromAccountId?: string[];
  toAccountId?: string[];
}

// ─── Skeleton Loading ───────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-4 border-b border-gray-100"
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

function CardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
      <div className="h-7 bg-gray-200 rounded w-28" />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function TransactionsPage() {
  // ── Server-side filter state ──────────────────────
  const [filter, setFilter] = useState<
    "all" | "income" | "expense" | "transfer"
  >("all");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // ── Debounce search ───────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to page 1 on search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedAccount, dateRange.start, dateRange.end]);

  // ── React Query data ──────────────────────────────
  const {
    data: txData,
    isLoading: txLoading,
    isError: txError,
    error: txErrorObj,
    refetch: refetchTx,
  } = useTransactionsPaginated({
    page: currentPage,
    limit: pageSize,
    type: filter,
    search: debouncedSearch,
    account: selectedAccount,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Fetch all accounts (unpaginated) for the account filter & form dropdowns
  const { data: accountsData } = useAccounts({
    page: 1,
    limit: 100,
    includeGoals: true,
  });

  const transactions = txData?.data ?? [];
  const pagination = txData?.pagination;
  const summary = txData?.summary;
  const accounts = accountsData?.data ?? [];

  // ── Mutations ─────────────────────────────────────
  const addMutation = useAddTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  // ── Form state ────────────────────────────────────
  const [transactionType, setTransactionType] = useState<
    "income" | "expense" | "transfer"
  >("expense");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editTransaction, setEditTransaction] = useState<ITransaction | null>(
    null,
  );
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editTransaction?.type) {
      setTransactionType(editTransaction.type);
    }
  }, [editTransaction]);

  // ── Handlers ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData(e.currentTarget);
    const txType = formData.get("type") as "income" | "expense" | "transfer";

    let raw: Record<string, unknown>;

    if (txType === "transfer") {
      raw = {
        type: "transfer" as const,
        description: (formData.get("description") as string) || "",
        fromAccountId: (formData.get("fromAccountId") as string) || "",
        toAccountId: (formData.get("toAccountId") as string) || "",
        amount: Number(formData.get("amount")) || 0,
        date: (formData.get("date") as string) || "",
        category: "Transfer",
      };
    } else if (txType === "income") {
      raw = {
        type: "income" as const,
        description: (formData.get("description") as string) || "",
        category: (formData.get("category") as string) || "",
        toAccountId: (formData.get("toAccountId") as string) || "",
        amount: Number(formData.get("amount")) || 0,
        date: (formData.get("date") as string) || "",
      };
    } else {
      raw = {
        type: "expense" as const,
        description: (formData.get("description") as string) || "",
        category: (formData.get("category") as string) || "",
        fromAccountId: (formData.get("fromAccountId") as string) || "",
        amount: Number(formData.get("amount")) || 0,
        date: (formData.get("date") as string) || "",
      };
    }

    // Validate with Zod
    const result = createTransactionSchema.safeParse(raw);
    if (!result.success) {
      setFormErrors(result.error.flatten().fieldErrors as FormErrors);
      return;
    }

    try {
      if (editTransaction) {
        await updateMutation.mutateAsync({
          id: editTransaction._id,
          data: result.data,
        });
        setEditTransaction(null);
      } else {
        await addMutation.mutateAsync(result.data as CreateTransactionInput);
      }
      setShowForm(false);
      setFormErrors({});
    } catch {
      // Error handled by mutation's onError
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch {
        // Error handled by mutation's onError
      }
    }
  };

  const resetFilters = () => {
    setFilter("all");
    setSelectedAccount("all");
    setSearch("");
    setDebouncedSearch("");
    setDateRange({ start: "", end: "" });
    setCurrentPage(1);
  };

  const isMutating = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transaction History
          </h1>
          <p className="text-gray-600">Manage all your income and expenses</p>
        </div>

        <button
          onClick={() => {
            setShowForm(true);
            setEditTransaction(null);
            setFormErrors({});
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {txLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-gray-500 text-xs md:text-sm mb-1">Total Income</p>
              <p className="text-lg md:text-2xl font-bold text-green-600 truncate">
                {formatCurrency(summary?.totalIncome ?? 0)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-gray-500 text-xs md:text-sm mb-1">Total Expenses</p>
              <p className="text-lg md:text-2xl font-bold text-red-600 truncate">
                {formatCurrency(summary?.totalExpense ?? 0)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center col-span-2 md:col-span-1">
              <p className="text-gray-500 text-xs md:text-sm mb-1">Net Cash Flow</p>
              <p
                className={`text-xl md:text-2xl font-bold truncate ${
                  (summary?.netFlow ?? 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(summary?.netFlow ?? 0)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="hidden md:block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl md:rounded-lg text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 md:col-span-4 gap-3 md:gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                className="w-full px-2 md:px-4 py-2 border border-gray-300 rounded-xl md:rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilter(
                    e.target.value as "all" | "income" | "expense" | "transfer",
                  )
                }
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            {/* Account Filter */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Account
              </label>
              <select
                className="w-full px-2 md:px-4 py-2 border border-gray-300 rounded-xl md:rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="all">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  className="w-full pl-2 pr-1 md:pl-9 py-2 border border-gray-300 rounded-xl md:rounded-lg text-[13px] md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 md:block hidden"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                />
                 {/* Native date input for mobile looks better standard, using calendar icon */}
                 <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl md:hidden text-[13px] focus:ring-2 focus:ring-indigo-500"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                />
                <Calendar
                  className="hidden md:block absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>

            {/* Date Range End */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  className="w-full pl-2 pr-1 md:pl-9 py-2 border border-gray-300 rounded-xl md:rounded-lg text-[13px] md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 md:block hidden"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                />
                {/* Native date input for mobile */}
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl md:hidden text-[13px] focus:ring-2 focus:ring-indigo-500"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                />
                <Calendar
                  className="hidden md:block absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between md:justify-end mt-4 gap-2 border-t border-gray-50 pt-4 md:border-t-0 md:pt-0">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-xl md:rounded-lg hover:bg-gray-50 flex-1 md:flex-none"
          >
            Reset Filters
          </button>
          <div className="flex-1 md:flex-none">
            <ExportCSVButton
              data={transactions}
              filename="transactions.csv"
              label="Export CSV"
            />
          </div>
        </div>
      </div>

      {/* ─── Transactions Table ──────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Error State */}
        {txError && (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="mx-auto text-red-400 mb-3" size={40} />
            <p className="text-gray-600 mb-2">
              {txErrorObj?.message || "Failed to load transactions"}
            </p>
            <button
              onClick={() => refetchTx()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading */}
        {txLoading && <TableSkeleton />}

        {/* Table */}
        {!txLoading && !txError && (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                    Description
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                    Category
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                    Account
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                    Date
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                    Type
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div
                            className={`p-2 rounded-lg mr-3 flex-shrink-0 ${
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
                          <div>
                            <div className="font-medium text-gray-900">
                              {transaction.description}
                            </div>
                            <div className="text-sm text-gray-500">
                              Transaction ID: {transaction._id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${
                            categories.find(
                              (c) => c.name === transaction.category,
                            )?.color || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {transaction.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-800">
                          {transaction.type === "expense" &&
                            ` (From: ${
                              accounts.find(
                                (acc) => acc._id === transaction.fromAccountId,
                              )?.name || "Unknown Account"
                            })`}

                          {transaction.type === "income" &&
                            ` (To: ${
                              accounts.find(
                                (acc) => acc._id === transaction.toAccountId,
                              )?.name || "Unknown Account"
                            })`}

                          {transaction.type === "transfer" &&
                            ` (From: ${
                              accounts.find(
                                (acc) => acc._id === transaction.fromAccountId,
                              )?.name || "Unknown Account"
                            } → To: ${
                              accounts.find(
                                (acc) => acc._id === transaction.toAccountId,
                              )?.name || "Unknown Account"
                            })`}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(transaction.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === "expense"
                              ? "bg-red-100 text-red-800"
                              : " bg-green-100 text-green-800"
                          }`}
                        >
                          {transaction.type.charAt(0).toUpperCase() +
                            transaction.type.slice(1)}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-4 text-right font-medium ${
                          transaction.type === "expense"
                            ? " text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {transaction.type === "expense" ? "-" : "+"}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end">
                          <div className="relative">
                            <button
                              className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                              onClick={() => {
                                setEditTransaction(transaction);
                                setShowForm(true);
                                setFormErrors({});
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="p-1 text-gray-500 hover:text-red-500 rounded hover:bg-gray-100 ml-2"
                              onClick={() => handleDelete(transaction._id)}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Filter
                          className="text-gray-400 mx-auto mb-4"
                          size={40}
                        />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          No transactions found
                        </h3>
                        <p className="text-gray-500 max-w-md">
                          Try adjusting your search or filter criteria to find
                          what you&apos;re looking for.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Mobile List View */}
            {transactions.length > 0 && (
              <div className="md:hidden divide-y divide-gray-50">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`p-2.5 rounded-xl flex-shrink-0 ${
                            transaction.type === "income"
                              ? "bg-green-100 text-green-600"
                              : transaction.type === "transfer"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-red-100 text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? (
                            <ArrowUpRight size={18} />
                          ) : transaction.type === "transfer" ? (
                            <ArrowRightLeft size={18} />
                          ) : (
                            <ArrowDownRight size={18} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 leading-tight truncate">
                            {transaction.description || "No description"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded flex-shrink-0 ${
                                categories.find(
                                  (c) => c.name === transaction.category,
                                )?.color || "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className={`font-semibold text-sm ${
                            transaction.type === "income"
                              ? "text-green-600"
                              : transaction.type === "transfer"
                                ? "text-blue-600"
                                : "text-red-600"
                          }`}
                        >
                          {transaction.type === "expense" ? "-" : transaction.type === "income" ? "+" : ""}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {new Date(transaction.date).toLocaleDateString("en-GB")}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                       <span className="text-[11px] text-gray-500 truncate pr-4">
                          {transaction.type === "expense" &&
                            `From: ${
                              accounts.find(
                                (acc) => acc._id === transaction.fromAccountId,
                              )?.name || "Unknown"
                            }`}

                          {transaction.type === "income" &&
                            `To: ${
                              accounts.find(
                                (acc) => acc._id === transaction.toAccountId,
                              )?.name || "Unknown"
                            }`}

                          {transaction.type === "transfer" &&
                            `${
                              accounts.find(
                                (acc) => acc._id === transaction.fromAccountId,
                              )?.name || "Unknown"
                            } → ${
                              accounts.find(
                                (acc) => acc._id === transaction.toAccountId,
                              )?.name || "Unknown"
                            }`}
                        </span>

                      <div className="flex gap-4">
                        <button
                          className="text-gray-500 flex items-center gap-1.5 hover:text-gray-700 text-[12px] font-medium"
                          onClick={() => {
                            setEditTransaction(transaction);
                            setShowForm(true);
                            setFormErrors({});
                          }}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          className="text-red-500 flex items-center gap-1.5 hover:text-red-700 text-[12px] font-medium disabled:opacity-50"
                          onClick={() => handleDelete(transaction._id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )} 
                          Del
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Empty State Mobile */}
            {transactions.length === 0 && (
              <div className="md:hidden px-4 py-8 text-center bg-white">
                <Filter
                  className="text-gray-300 mx-auto mb-3"
                  size={32}
                />
                <h3 className="text-base font-medium text-gray-900 mb-1">
                  No transactions found
                </h3>
                <p className="text-sm text-gray-500">
                  Try adjusting your filters.
                </p>
              </div>
            )}
          </div>
        )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
          <div className="text-sm text-gray-500 order-2 md:order-1">
            Showing <span className="font-medium text-gray-900">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
            <span className="font-medium text-gray-900">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium text-gray-900">{pagination.total}</span>
          </div>
          
          <div className="flex items-center gap-1.5 order-1 md:order-2 self-stretch md:self-auto justify-between md:justify-start">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={pagination.page <= 1}
              className="flex items-center justify-center p-2 md:px-3 md:py-1.5 min-w-[40px] md:min-w-[auto] border border-gray-300 rounded-xl md:rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors bg-white"
            >
              <ChevronLeft size={16} />
              <span className="hidden md:inline ml-1">Prev</span>
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {Array.from(
                { length: Math.min(pagination.totalPages, 5) },
                (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[36px] h-[36px] flex items-center justify-center text-sm font-medium rounded-xl md:rounded-lg transition-colors border ${
                        currentPage === pageNum
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                },
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))
              }
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center justify-center p-2 md:px-3 md:py-1.5 min-w-[40px] md:min-w-[auto] border border-gray-300 rounded-xl md:rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors bg-white"
            >
              <span className="hidden md:inline mr-1">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      </div>

      {/* ─── Add/Edit Transaction Modal ─────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[100] md:p-4">
          <div className="bg-white rounded-t-[2rem] md:rounded-2xl w-full max-w-md shadow-2xl animate-slide-up md:animate-none flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-2 md:hidden"></div>
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 pt-2 md:pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editTransaction ? "Edit Transaction" : "Add Transaction"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditTransaction(null);
                  setFormErrors({});
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain no-scrollbar pb-safe">
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Type Tabs */}
                <div>
                  <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1.5 rounded-xl">
                  {(
                    [
                      {
                        value: "expense",
                        label: "Expense",
                        icon: <ArrowDownRight size={16} />,
                        colorActive: "text-red-600",
                      },
                      {
                        value: "income",
                        label: "Income",
                        icon: <ArrowUpRight size={16} />,
                        colorActive: "text-green-600",
                      },
                      {
                        value: "transfer",
                        label: "Transfer",
                        icon: <ArrowRightLeft size={16} />,
                        colorActive: "text-blue-600",
                      },
                    ] as const
                  ).map(({ value, label, icon, colorActive }) => (
                    <button
                      key={value}
                      type="button"
                      disabled={!!editTransaction}
                      onClick={() => {
                        setTransactionType(value);
                        setFormErrors({});
                      }}
                      className={`py-2 px-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        transactionType === value
                          ? `bg-white shadow ${colorActive}`
                          : "text-gray-500 hover:text-gray-700"
                      } disabled:cursor-not-allowed`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                  </div>
                  {editTransaction && (
                    <p className="mt-1.5 text-xs text-gray-400 text-center">
                      Type cannot be changed when editing
                    </p>
                  )}
                </div>
                <input type="hidden" name="type" value={transactionType} />

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    defaultValue={editTransaction?.description || ""}
                    placeholder="e.g. Grocery shopping"
                    className={`w-full px-4 py-2 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.description
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-xs text-red-600">
                      {formErrors.description[0]}
                    </p>
                  )}
                </div>

                {/* Amount + Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      defaultValue={editTransaction?.amount || ""}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-2 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.amount
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    />
                    {formErrors.amount && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.amount[0]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      defaultValue={
                        editTransaction?.date
                          ? new Date(editTransaction.date)
                              .toISOString()
                              .split("T")[0]
                          : new Date().toISOString().split("T")[0]
                      }
                      className={`w-full px-4 py-2 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.date
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    />
                    {formErrors.date && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.date[0]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Category (not for transfer) */}
                {transactionType !== "transfer" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      defaultValue={editTransaction?.category || ""}
                      className={`w-full px-4 py-2 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.category
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select category</option>
                      {categories
                        .filter((cat) => {
                          if (transactionType === "income") {
                            return cat.name === "Salary" || cat.name === "Other";
                          }
                          if (transactionType === "expense") {
                            return cat.name !== "Salary";
                          }
                          return true;
                        })
                        .map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                    {formErrors.category && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.category[0]}
                      </p>
                    )}
                  </div>
                )}

                {/* From Account — expense & transfer */}
                {(transactionType === "expense" ||
                  transactionType === "transfer") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {transactionType === "transfer"
                        ? "From Account"
                        : "Account (Spent From)"}
                    </label>
                    <select
                      name="fromAccountId"
                      defaultValue={editTransaction?.fromAccountId || ""}
                      className={`w-full px-4 py-2 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.fromAccountId
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select account</option>
                      {accounts
                        .filter(
                          (acc) =>
                            (transactionType === "transfer" || acc.type !== "goal") &&
                            acc.type !== "investment" &&
                            acc.name !== "Deleted Account",
                        )
                        .map((acc) => (
                          <option key={acc._id} value={acc._id}>
                            {acc.name} — ₹{acc.balance?.toLocaleString()}
                          </option>
                        ))}
                    </select>
                    {formErrors.fromAccountId && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.fromAccountId[0]}
                      </p>
                    )}
                  </div>
                )}

                {/* To Account — income & transfer */}
                {(transactionType === "income" ||
                  transactionType === "transfer") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {transactionType === "transfer"
                        ? "To Account"
                        : "Account (Received Into)"}
                    </label>
                    <select
                      name="toAccountId"
                      defaultValue={editTransaction?.toAccountId || ""}
                      className={`w-full px-4 py-2 border rounded-xl text-base md:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.toAccountId
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select account</option>
                      {accounts
                        .filter(
                          (acc) =>
                            (transactionType === "transfer" || acc.type !== "goal") &&
                            acc.type !== "investment" &&
                            acc.name !== "Deleted Account",
                        )
                        .map((acc) => (
                          <option key={acc._id} value={acc._id}>
                            {acc.name} — ₹{acc.balance?.toLocaleString()}
                          </option>
                        ))}
                    </select>
                    {formErrors.toAccountId && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.toAccountId[0]}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditTransaction(null);
                      setFormErrors({});
                    }}
                    className="flex-1 px-4 py-3 md:py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isMutating}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 text-sm text-white rounded-xl font-medium transition-colors disabled:opacity-60 ${
                      transactionType === "expense"
                        ? "bg-red-500 hover:bg-red-600"
                        : transactionType === "income"
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {isMutating && <Loader2 size={16} className="animate-spin" />}
                    {editTransaction ? "Update" : "Save"}{" "}
                    {transactionType.charAt(0).toUpperCase() +
                      transactionType.slice(1)}
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
