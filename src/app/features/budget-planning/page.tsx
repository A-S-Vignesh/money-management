"use client";

import { useState } from "react";
import {
  Target,
  TrendingUp,
  Calendar,
  Bell,
  PieChart,
  Download,
  Plus,
  BarChart,
  Wallet,
  Goal,
  Repeat,
  Zap,
} from "lucide-react";

export default function BudgetPlanning() {
  const [activeTab, setActiveTab] = useState("overview");

  // Sample budget categories
  const budgetCategories = [
    { name: "Housing", allocated: 1200, spent: 1150, color: "bg-blue-500" },
    { name: "Food", allocated: 600, spent: 450, color: "bg-green-500" },
    {
      name: "Transportation",
      allocated: 300,
      spent: 280,
      color: "bg-yellow-500",
    },
    {
      name: "Entertainment",
      allocated: 200,
      spent: 220,
      color: "bg-purple-500",
    },
    { name: "Utilities", allocated: 250, spent: 210, color: "bg-red-500" },
    { name: "Savings", allocated: 500, spent: 500, color: "bg-indigo-500" },
  ];

  const features = [
    {
      icon: <Target className="h-8 w-8 text-indigo-600" />,
      title: "Custom Budgets",
      description:
        "Create personalized budgets for different categories with flexible time periods.",
    },
    {
      icon: <Bell className="h-8 w-8 text-indigo-600" />,
      title: "Smart Alerts",
      description:
        "Get notified when you're approaching budget limits or have unusual spending patterns.",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-indigo-600" />,
      title: "Progress Tracking",
      description:
        "Monitor your budget performance with visual progress indicators and forecasts.",
    },
    {
      icon: <PieChart className="h-8 w-8 text-indigo-600" />,
      title: "Visual Reports",
      description:
        "Understand your spending patterns with beautiful charts and category breakdowns.",
    },
  ];

  const benefits = [
    {
      icon: <Wallet className="h-6 w-6 text-indigo-600" />,
      title: "Save More Money",
      description:
        "Users save an average of 20% more when using our budget planning tools.",
    },
    {
      icon: <Goal className="h-6 w-6 text-indigo-600" />,
      title: "Reach Goals Faster",
      description:
        "83% of users report achieving financial goals sooner with structured budgeting.",
    },
    {
      icon: <Repeat className="h-6 w-6 text-indigo-600" />,
      title: "Reduce Financial Stress",
      description:
        "Knowing where your money goes reduces anxiety about finances.",
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
                Budget Planning
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create, track, and optimize your budgets with Money Nest's
              powerful planning tools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Plan Your Financial Future
              </h2>
              <p className="text-gray-600 mb-4">
                Money Nest's budget planning tools help you allocate your income
                effectively, track spending against your goals, and adjust as
                needed to stay on track.
              </p>
              <p className="text-gray-600 mb-4">
                Whether you're saving for a big purchase, paying down debt, or
                just want more control over your finances, our budgeting
                features make it simple and effective.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <button className="inline-flex items-center px-6 py-3.5 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
                  Create Your Budget
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
                    October Budget
                  </h3>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>On Track</span>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  {budgetCategories.map((category, index) => {
                    const percentage = Math.min(
                      100,
                      (category.spent / category.allocated) * 100
                    );
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{category.name}</span>
                          <span className="text-gray-900">
                            ${category.spent} / ${category.allocated}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentage > 90
                                ? "bg-red-500"
                                : percentage > 75
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm">
                    <div className="text-gray-500">Total Budget</div>
                    <div className="font-bold text-gray-900">$3,050</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Total Spent</div>
                    <div className="font-bold text-gray-900">$2,810</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Remaining</div>
                    <div className="font-bold text-green-600">$240</div>
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
              Powerful Budget Planning Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to create, manage, and optimize your budgets.
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

      {/* Benefits Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Budget with Money Nest?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our users experience real financial benefits from using our
              budgeting tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Budget Planning Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Getting started with Money Nest's budget planning is simple and
              effective.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Set Your Budget",
                description:
                  "Create custom budgets for different spending categories based on your income and goals.",
              },
              {
                step: "2",
                title: "Track Spending",
                description:
                  "Connect accounts or manually enter transactions to track against your budget.",
              },
              {
                step: "3",
                title: "Get Insights",
                description:
                  "Receive alerts and see visual reports on your spending patterns.",
              },
              {
                step: "4",
                title: "Adjust & Optimize",
                description:
                  "Make changes to your budget based on actual spending and financial goals.",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full text-lg font-bold mb-4 mx-auto">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to take control of your finances?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of users who are achieving their financial goals with
            Money Nest's budget planning.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 shadow-lg transition-all">
              Start Budgeting
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
