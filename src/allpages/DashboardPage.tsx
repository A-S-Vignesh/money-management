// app/dashboard/page.tsx
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
} from "lucide-react";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useAccountStore } from "@/store/useAccountStore";
import { useGoalStore } from "@/store/useGoalStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { categories } from "@/utils/categories";
import { formatCurrency } from "@/utils/formatCurrency";

export default function DashboardPage() {
  const { transactions } = useTransactionStore();
  const { accounts } = useAccountStore();
  const { goals } = useGoalStore();
  const { budgets } = useBudgetStore();
  // const categoryTotals: Record<CategoryName, number> = {
  //   Food: 0,
  //   Housing: 0,
  //   Transport: 0,
  //   Lifestyle: 0,
  //   Shopping: 0,
  //   Learning: 0,
  //   Personal: 0,
  //   Salary: 0,
  //   Transfer: 0,
  //   Other: 0,
  // };

  // transactions.forEach((transaction) => {
  //   if (transaction.type === "expense") {
  //     categoryTotals[transaction.category] += transaction.amount;
  //   }
  // });
  const categoryTotals = categories.map((cat) => {
    const total = transactions
      .filter((t) => t.type === "expense" && t.category === cat.name)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      category: cat.name,
      amount: total,
      color: cat.color.replace("text-", "bg-"), // adapt if you want bar colors
    };
  });

  // Find grand total for percentages
  const grandTotal = categoryTotals.reduce((sum, c) => sum + c.amount, 0);

  // Add percentage
  const categoryWithPercentages = categoryTotals.map((c) => ({
    ...c,
    percentage: grandTotal ? ((c.amount / grandTotal) * 100).toFixed(1) : 0,
  }));

  // Calculate financial metrics
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const available = accounts.map((a) => a.balance).reduce((a, b) => a + b, 0);
  const netChange = income - expense;
  const isPositive = netChange >= 0;
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {}</h1>
        <p className="text-gray-600">
          Here's your financial overview for today
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <Wallet className="text-blue-600" size={20} />
            </div>
            <h3 className="text-gray-500 text-sm font-medium">Total Balance</h3>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold">{formatCurrency(available)}</p>
            <span
              className={`${
                isPositive ? "text-green-500" : "text-red-500"
              } bg-green-50 px-2 py-1 rounded text-sm`}
            >
              {isPositive ? "+" : ""}₹{Math.abs(netChange)}
            </span>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <ArrowUpRight className="text-green-600" size={20} />
            </div>
            <h3 className="text-gray-500 text-sm font-medium">Total Income</h3>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(income)}
            </p>
            <span className="text-green-500 bg-green-50 px-2 py-1 rounded text-sm">
              +12%
            </span>
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
              {formatCurrency(expense)}
            </p>
            <span className="text-red-500 bg-red-50 px-2 py-1 rounded text-sm">
              -8%
            </span>
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
              {/* ₹{(available).toLocaleString()} */}
              {formatCurrency(available)}
            </p>
            <span className="text-green-500 bg-green-50 px-2 py-1 rounded text-sm">
              +5.2%
            </span>
          </div>
        </div>
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

          <div className="space-y-4">
            {categoryWithPercentages.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="font-medium">₹{item.amount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
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
              See all Goal
            </Link>
          </div>

          <div className="space-y-5">
            {goals.length > 0 ? (
              goals.map((goal, index) => {
                const progress = Math.min(
                  100,
                  ((goal?.current || 0) / goal.target) * 100
                );

                return (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-gray-600">
                        {/* ₹{goal?.current || 0}/₹{goal.target.toLocaleString()} */}
                        {formatCurrency(goal?.current||0)}/ {formatCurrency(goal.target)}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>

                    <p className="text-right text-sm text-gray-500 mt-1">
                      {progress.toFixed(0)}% completed
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Target className="text-gray-400 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No goals found
                </h3>
                <p className="text-gray-500 max-w-md mb-6">
                  You haven't set any financial goals yet.
                </p>
                {/* <button
                  onClick={() => {
                    setShowForm(true);
                    setEditGoal(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  <Plus size={16} />
                  <span>Create Your First Goal</span>
                </button> */}
              </div>
            )}
          </div>
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-left border-b">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-4">
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
                            ) : transaction.type === "expense" ? (
                              <ArrowDownRight
                                className="text-red-600"
                                size={16}
                              />
                            ) : (
                              <DollarSign className="text-gray-600" size={16} />
                            )}
                          </div>
                          {transaction.category}
                        </div>
                      </td>
                      <td className="py-4 text-gray-600">
                        {new Date(transaction.date).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
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
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {/* {transaction.amount} */}
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
                          It's looks like no transaction found. Start
                          transaction to see here
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Active Budgets</p>
              <p className="text-2xl font-bold mt-1">{budgets.length || 0}</p>
            </div>
            <PieChart className="text-white opacity-80" size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Savings Rate</p>
              <p className="text-2xl font-bold mt-1">22%</p>
            </div>
            <TrendingUp className="text-white opacity-80" size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Upcoming Bills</p>
              <p className="text-2xl font-bold mt-1">2</p>
            </div>
            <CreditCard className="text-white opacity-80" size={32} />
          </div>
        </div>
      </div>
    </div>
  );
}
