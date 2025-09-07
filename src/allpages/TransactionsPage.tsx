// app/dashboard/transactions/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useAccountStore } from "@/store/useAccountStore";
import ExportCSVButton from "@/components/ExportCSVButton";
import { categories, categoryMap, CategoryName } from "@/utils/categories";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Calendar,
} from "lucide-react";
import { ITransaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/formatCurrency";

export default function TransactionsPage() {
  const { transactions, addTransaction, updateTransaction, removeTransaction } =
    useTransactionStore();

  const { accounts } = useAccountStore();

  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [transactionType, setTransactionType] = useState<
    "income" | "expense" | "transfer"
  >("expense");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editTransaction, setEditTransaction] = useState<ITransaction | null>(
    null
  );
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    if (editTransaction?.type) {
      setTransactionType(editTransaction.type);
    }
  }, [editTransaction]);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType = filter === "all" || transaction.type === filter;

    const matchesSearch =
      transaction.description.toLowerCase().includes(search.toLowerCase()) ||
      transaction.category.toLowerCase().includes(search.toLowerCase());

    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setDate(endDate.getDate() + 1); // Include end date
      matchesDate = transactionDate >= startDate && transactionDate < endDate;
    }

    const accountType =
      transaction.type === "expense" ? "fromAccountId" : "toAccountId";

    const matchesAccount =
      selectedAccount === "all" || transaction[accountType] === selectedAccount;

    return matchesType && matchesSearch && matchesDate && matchesAccount;
  });

  const pageSize = 7;

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // This fixes the "startIdx is not defined" error
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, filteredTransactions.length);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalIncome - totalExpense;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const transactionType = formData.get("type") as
      | "income"
      | "expense"
      | "transfer";

    type NewTransaction = Omit<ITransaction, "_id">;

    let transaction: NewTransaction;

    if (transactionType === "transfer") {
      transaction = {
        type: "transfer",
        description: formData.get("description") as string,
        fromAccountId: formData.get("fromAccountId") as string,
        toAccountId: formData.get("toAccountId") as string,
        amount: Number(formData.get("amount")),
        date: formData.get("date") as string, // or new Date(...) if your type expects Date
        category: "Transfer", // auto-set
      };
    } else if (transactionType === "income") {
      transaction = {
        type: transactionType,
        description: formData.get("description") as string,
        category: formData.get("category") as CategoryName,
        toAccountId: formData.get("toAccountId") as string,
        amount: Number(formData.get("amount")),
        date: formData.get("date") as string,
      };
    } else {
      transaction = {
        type: transactionType,
        description: formData.get("description") as string,
        category: formData.get("category") as CategoryName,
        fromAccountId: formData.get("fromAccountId") as string,
        amount: Number(formData.get("amount")),
        date: formData.get("date") as string,
      };
    }

    console.log("Form submitted", transaction);

    if (editTransaction) {
      await updateTransaction(editTransaction._id, transaction);
      setEditTransaction(null);
    } else {
      await addTransaction(transaction);
    }

    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      await removeTransaction(id);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilter("all");
    setSelectedAccount("all");
    setSearch("");
    setDateRange({ start: "", end: "" });
  };

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
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Total Income</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Net Cash Flow</p>
          <p
            className={`text-2xl font-bold ${
              netFlow >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {/* {netFlow >= 0 ? "+" : "-"}₹{Math.abs(netFlow).toLocaleString()} */}
            {formatCurrency(netFlow)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Description or category..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={filter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilter(e.target.value as "all" | "income" | "expense")
              }
            >
              <option value="all">All Transactions</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Reset Filters
          </button>
          <ExportCSVButton
            data={filteredTransactions}
            filename="transactions.csv"
            label="Export CSV"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
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
              {filteredTransactions.length > 0 ? (
                paginatedTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
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
                            (c) => c.name === transaction.category
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
                              (acc) => acc._id === transaction.fromAccountId
                            )?.name || "Unknown Account"
                          })`}

                        {transaction.type === "income" &&
                          ` (To: ${
                            accounts.find(
                              (acc) => acc._id === transaction.toAccountId
                            )?.name || "Unknown Account"
                          })`}

                        {transaction.type === "transfer" &&
                          ` (From: ${
                            accounts.find(
                              (acc) => acc._id === transaction.fromAccountId
                            )?.name || "Unknown Account"
                          } → To: ${
                            accounts.find(
                              (acc) => acc._id === transaction.toAccountId
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
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="p-1 text-gray-500 hover:text-red-500 rounded hover:bg-gray-100 ml-2"
                            onClick={() => handleDelete(transaction._id)}
                          >
                            <Trash2 size={16} />
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
                        what you're looking for.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredTransactions.length > 0 && totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIdx}</span> to{" "}
              <span className="font-medium">{endIdx}</span> of{" "}
              <span className="font-medium">{filteredTransactions.length}</span>{" "}
              results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border border-gray-300 rounded ${
                    currentPage === i + 1
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Transaction Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editTransaction ? "Edit Transaction" : "Add New Transaction"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditTransaction(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {!editTransaction ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="type"
                            value="income"
                            checked={transactionType === "income"}
                            onChange={() => setTransactionType("income")}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2">Income</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="type"
                            value="expense"
                            checked={transactionType === "expense"}
                            onChange={() => setTransactionType("expense")}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2">Expense</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="type"
                            value="transfer"
                            checked={transactionType === "transfer"}
                            onChange={() => setTransactionType("transfer")}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2">Transfer</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <input type="hidden" name="type" value={transactionType} />
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      defaultValue={editTransaction?.description || ""}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter description"
                      required
                    />
                  </div>
                  {transactionType !== "transfer" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        defaultValue={editTransaction?.category || ""}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.name} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {transactionType === "transfer" ? (
                    <>
                      {/* From Account */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          From Account
                        </label>
                        <select
                          name="fromAccountId"
                          defaultValue={editTransaction?.fromAccountId || ""}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        >
                          <option value="">Select account</option>
                          {accounts
                            .filter(
                              (acc) =>
                                acc.type !== "goal" && acc.type !== "investment"
                            )

                            .map((acc) => (
                              <option key={acc._id} value={acc._id}>
                                {acc.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* To Account */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          To Account
                        </label>
                        <select
                          name="toAccountId"
                          defaultValue={editTransaction?.toAccountId || ""}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        >
                          <option value="">Select account</option>
                          {accounts
                            .filter((acc) => acc.name !== "Deleted Account")

                            .map((acc) => (
                              <option key={acc._id} value={acc._id}>
                                {acc.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  ) : transactionType === "income" ? (
                    <>
                      {/* Income → To Account */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account (Money Received Into)
                        </label>
                        <select
                          name="toAccountId"
                          defaultValue={editTransaction?.toAccountId || ""}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        >
                          <option value="">Select account</option>
                          {accounts
                            .filter(
                              (acc) =>
                                acc.type !== "goal" &&
                                acc.type !== "investment" &&
                                acc.name !== "Deleted Account"
                            )
                            .map((acc) => (
                              <option key={acc._id} value={acc._id}>
                                {acc.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Expense → From Account */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account (Money Spent From)
                        </label>
                        <select
                          name="fromAccountId"
                          defaultValue={editTransaction?.fromAccountId || ""}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        >
                          <option value="">Select account</option>
                          {accounts
                            .filter(
                              (acc) =>
                                acc.type !== "goal" &&
                                acc.type !== "investment" &&
                                acc.name !== "Deleted Account"
                            )
                            .map((acc) => (
                              <option key={acc._id} value={acc._id}>
                                {acc.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      defaultValue={editTransaction?.amount || ""}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditTransaction(null);
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editTransaction ? "Update" : "Add"} Transaction
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
