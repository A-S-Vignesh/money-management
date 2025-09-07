"use client";

import { useState } from "react";
import {
  Plus,
  Filter,
  Download,
  TrendingUp,
  PieChart,
  Calendar,
  Tag,
  DollarSign,
  Smartphone,
  Shield,
  Zap,
  BarChart,
} from "lucide-react";

export default function ExpenseTracking() {
  const [activeTab, setActiveTab] = useState("overview");

  // Sample expense categories with icons and colors
  const categories = [
    {
      name: "Food & Dining",
      amount: 425,
      color: "bg-red-100 text-red-600",
      icon: "🍔",
    },
    {
      name: "Transportation",
      amount: 210,
      color: "bg-blue-100 text-blue-600",
      icon: "🚗",
    },
    {
      name: "Entertainment",
      amount: 150,
      color: "bg-purple-100 text-purple-600",
      icon: "🎬",
    },
    {
      name: "Shopping",
      amount: 320,
      color: "bg-yellow-100 text-yellow-600",
      icon: "🛍️",
    },
    {
      name: "Utilities",
      amount: 180,
      color: "bg-green-100 text-green-600",
      icon: "💡",
    },
  ];

  // Sample recent transactions
  const transactions = [
    {
      id: 1,
      name: "Grocery Store",
      amount: 78.5,
      category: "Food & Dining",
      date: "2023-10-15",
      type: "expense",
    },
    {
      id: 2,
      name: "Gas Station",
      amount: 45.0,
      category: "Transportation",
      date: "2023-10-14",
      type: "expense",
    },
    {
      id: 3,
      name: "Netflix Subscription",
      amount: 15.99,
      category: "Entertainment",
      date: "2023-10-13",
      type: "expense",
    },
    {
      id: 4,
      name: "Salary Deposit",
      amount: 2500.0,
      category: "Income",
      date: "2023-10-05",
      type: "income",
    },
    {
      id: 5,
      name: "Coffee Shop",
      amount: 5.75,
      category: "Food & Dining",
      date: "2023-10-12",
      type: "expense",
    },
  ];

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-indigo-600" />,
      title: "Instant Tracking",
      description:
        "Record expenses in seconds with our streamlined interface and smart suggestions.",
    },
    {
      icon: <PieChart className="h-8 w-8 text-indigo-600" />,
      title: "Visual Analytics",
      description:
        "Understand your spending patterns with beautiful charts and category breakdowns.",
    },
    {
      icon: <Smartphone className="h-8 w-8 text-indigo-600" />,
      title: "Mobile Sync",
      description:
        "Access your expense data anywhere with our iOS and Android apps.",
    },
    {
      icon: <Shield className="h-8 w-8 text-indigo-600" />,
      title: "Bank-Level Security",
      description:
        "Your financial data is protected with 256-bit encryption and secure protocols.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Smart{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                Expense Tracking
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Track, categorize, and analyze your spending with Money Nest's
              powerful expense tracking tools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Take Control of Your Spending
              </h2>
              <p className="text-gray-600 mb-4">
                Money Nest's expense tracking helps you understand where your
                money is going with intuitive categorization, customizable
                budgets, and insightful analytics.
              </p>
              <p className="text-gray-600 mb-4">
                Whether you're tracking daily coffee runs or monthly
                subscriptions, our tools make it simple to stay on top of your
                finances.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <button className="inline-flex items-center px-6 py-3.5 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
                  Start Tracking Now
                  <Plus className="ml-2 h-5 w-5" />
                </button>
                <button className="inline-flex items-center px-6 py-3.5 text-base font-medium rounded-xl text-indigo-600 bg-white border border-indigo-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md">
                  View Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    October Expenses
                  </h3>
                  <div className="text-2xl font-bold text-indigo-600">
                    $1,295.24
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  {categories.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-3">{category.icon}</span>
                        <span className="text-gray-700">{category.name}</span>
                      </div>
                      <div className="text-gray-900 font-medium">
                        ${category.amount}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Spent: $1,295</span>
                    <span>Budget: $2,000</span>
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 top-4 left-4 w-full h-full rounded-2xl bg-gradient-to-br from-blue-200 to-indigo-200"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Expense Tracking Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to track, analyze, and optimize your spending
              habits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-xl mb-4 mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                See Your Spending Patterns
              </h2>
              <p className="text-gray-600 mb-4">
                Our intuitive dashboard gives you a clear view of where your
                money is going with interactive charts and category breakdowns.
              </p>
              <p className="text-gray-600 mb-4">
                Set monthly budgets, receive alerts when you're approaching
                limits, and identify opportunities to save.
              </p>
              <div className="flex items-center mt-8">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
                    <BarChart className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900">
                    Smart Insights
                  </h4>
                  <p className="text-gray-600">
                    Get personalized recommendations to optimize your spending.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Recent Transactions
                </h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100"
                  >
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-lg ${
                          transaction.type === "income"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "⬆️" : "⬇️"}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.category}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}$
                      {transaction.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to take control of your expenses?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of users who are saving money and reducing financial
            stress with Money Nest's expense tracking.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 shadow-lg transition-all">
              Get Started Free
            </button>
            <button className="inline-flex items-center px-8 py-4 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-indigo-600 transition-all">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
