// app/dashboard/page.tsx
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart,
  CreditCard,
  DollarSign,
  PieChart,
  TrendingUp,
  Wallet,
} from "lucide-react";

export default function DashboardPage() {
  // Mock data for the dashboard
  const startingBalance = 10000;
  const transactions = [
    {
      id: 1,
      type: "expense",
      category: "Food",
      amount: 200,
      date: "2023-06-15",
    },
    {
      id: 2,
      type: "income",
      category: "Salary",
      amount: 3000,
      date: "2023-06-10",
    },
    {
      id: 3,
      type: "expense",
      category: "Transport",
      amount: 50,
      date: "2023-06-05",
    },
    {
      id: 4,
      type: "expense",
      category: "Shopping",
      amount: 450,
      date: "2023-06-02",
    },
    {
      id: 5,
      type: "income",
      category: "Freelance",
      amount: 1200,
      date: "2023-05-28",
    },
  ];

  // Calculate financial metrics
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const available = startingBalance + income - expense;
  const netChange = income - expense;
  const isPositive = netChange >= 0;
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Goals data
  const goals = [
    { name: "Emergency Fund", target: 10000, current: 7500 },
    { name: "Vacation", target: 5000, current: 1500 },
    { name: "New Car", target: 20000, current: 4500 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, John!
        </h1>
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
            <p className="text-2xl font-bold">₹{available.toLocaleString()}</p>
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
              ₹{income.toLocaleString()}
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
              ₹{expense.toLocaleString()}
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
              ₹{(available + 35000).toLocaleString()}
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
            {[
              {
                category: "Housing",
                amount: 1200,
                percentage: 42,
                color: "bg-blue-500",
              },
              {
                category: "Food",
                amount: 650,
                percentage: 23,
                color: "bg-green-500",
              },
              {
                category: "Transport",
                amount: 300,
                percentage: 10,
                color: "bg-yellow-500",
              },
              {
                category: "Entertainment",
                amount: 450,
                percentage: 16,
                color: "bg-purple-500",
              },
              {
                category: "Utilities",
                amount: 250,
                percentage: 9,
                color: "bg-red-500",
              },
            ].map((item, index) => (
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
            <button className="text-blue-600 text-sm font-medium">
              Add Goal
            </button>
          </div>

          <div className="space-y-5">
            {goals.map((goal, index) => {
              const progress = Math.min(
                100,
                (goal.current / goal.target) * 100
              );
              return (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-gray-600">
                      ₹{goal.current.toLocaleString()}/₹
                      {goal.target.toLocaleString()}
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
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Transactions
            </h2>
            <button className="text-blue-600 text-sm font-medium flex items-center">
              View All
              <ArrowUpRight className="ml-1" size={16} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-left border-b">
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
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
                          ) : (
                            <ArrowDownRight
                              className="text-red-600"
                              size={16}
                            />
                          )}
                        </div>
                        {transaction.category}
                      </div>
                    </td>
                    <td className="py-4 text-gray-600">{transaction.date}</td>
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
                      {transaction.type === "income" ? "+" : "-"}₹
                      {transaction.amount}
                    </td>
                  </tr>
                ))}
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
              <p className="text-2xl font-bold mt-1">3</p>
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
