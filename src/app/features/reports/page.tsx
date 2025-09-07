"use client";

import { useState } from "react";
import {
  BarChart,
  PieChart,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  FileText,
  Zap,
  Target,
  Eye,
} from "lucide-react";

export default function FinancialReports() {
  const [activeReport, setActiveReport] = useState("overview");

  // Sample report data
  const reports = [
    {
      id: "overview",
      name: "Financial Overview",
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      id: "cashflow",
      name: "Cash Flow",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      id: "spending",
      name: "Spending Analysis",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      id: "networth",
      name: "Net Worth",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  // Sample chart data
  const spendingData = [
    { category: "Housing", amount: 1200, percentage: 35, color: "bg-blue-500" },
    { category: "Food", amount: 600, percentage: 18, color: "bg-green-500" },
    {
      category: "Transportation",
      amount: 300,
      percentage: 9,
      color: "bg-yellow-500",
    },
    {
      category: "Entertainment",
      amount: 250,
      percentage: 7,
      color: "bg-purple-500",
    },
    { category: "Utilities", amount: 200, percentage: 6, color: "bg-red-500" },
    { category: "Other", amount: 850, percentage: 25, color: "bg-gray-500" },
  ];

  const features = [
    {
      icon: <BarChart className="h-8 w-8 text-indigo-600" />,
      title: "Customizable Reports",
      description:
        "Create tailored reports with the metrics that matter most to your financial goals.",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-indigo-600" />,
      title: "Trend Analysis",
      description:
        "Identify spending patterns and income trends with historical data comparisons.",
    },
    {
      icon: <PieChart className="h-8 w-8 text-indigo-600" />,
      title: "Visual Analytics",
      description:
        "Understand your finances at a glance with beautiful charts and graphs.",
    },
    {
      icon: <Download className="h-8 w-8 text-indigo-600" />,
      title: "Export Options",
      description:
        "Download reports in PDF, CSV, or Excel formats for offline analysis.",
    },
  ];

  const benefits = [
    {
      icon: <Zap className="h-6 w-6 text-indigo-600" />,
      title: "Save Time",
      description:
        "Generate comprehensive reports in seconds instead of hours with manual spreadsheets.",
    },
    {
      icon: <Target className="h-6 w-6 text-indigo-600" />,
      title: "Better Decisions",
      description:
        "92% of users report making better financial decisions with access to detailed reports.",
    },
    {
      icon: <Eye className="h-6 w-6 text-indigo-600" />,
      title: "Complete Visibility",
      description:
        "See the full picture of your financial health with consolidated reporting.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Comprehensive{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                Financial Reports
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your financial data into actionable insights with Money
              Nest's powerful reporting tools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Understand Your Financial Health
              </h2>
              <p className="text-gray-600 mb-4">
                Money Nest's financial reports help you analyze spending
                patterns, track progress toward goals, and make informed
                decisions with comprehensive data visualizations.
              </p>
              <p className="text-gray-600 mb-4">
                Whether you need a quick spending snapshot or a detailed net
                worth analysis, our reporting tools provide the clarity you need
                to take control of your finances.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <button className="inline-flex items-center px-6 py-3.5 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
                  Generate Reports
                  <FileText className="ml-2 h-5 w-5" />
                </button>
                <button className="inline-flex items-center px-6 py-3.5 text-base font-medium rounded-xl text-indigo-600 bg-white border border-indigo-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md">
                  View Sample
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Spending Analysis
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                      <Filter className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                      <Calendar className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-500">October 2023</div>
                    <div className="text-lg font-bold text-gray-900">
                      $3,400 Total
                    </div>
                  </div>

                  <div className="space-y-3">
                    {spendingData.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{item.category}</span>
                          <span className="text-gray-900">
                            ${item.amount} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between">
                    <div className="text-sm">
                      <div className="text-gray-500">Report Generated</div>
                      <div className="font-medium text-gray-900">
                        Oct 15, 2023
                      </div>
                    </div>
                    <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                      <Download className="h-4 w-4 mr-1" />
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 top-4 left-4 w-full h-full rounded-2xl bg-gradient-to-br from-blue-200 to-indigo-200"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Types Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comprehensive Report Types
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Access a wide range of financial reports tailored to your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`p-6 rounded-xl border transition-all ${
                  activeReport === report.id
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-indigo-300"
                }`}
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                    activeReport === report.id
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {report.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {report.name}
                </h3>
                <p className="text-sm text-gray-600 text-left">
                  {report.id === "overview" &&
                    "Complete summary of income, expenses, and savings"}
                  {report.id === "cashflow" &&
                    "Track money coming in and going out over time"}
                  {report.id === "spending" &&
                    "Breakdown of expenses by category and merchant"}
                  {report.id === "networth" &&
                    "Assets minus liabilities for complete financial picture"}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Reporting Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to analyze and understand your financial data.
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
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Customizable & Shareable
              </h2>
              <p className="text-gray-600 mb-4">
                Money Nest's financial reports are fully customizable with date
                ranges, categories, and visualization options to show exactly
                what you need to see.
              </p>
              <p className="text-gray-600 mb-4">
                Share reports with financial advisors, family members, or export
                for tax purposes with just a few clicks.
              </p>
              <div className="flex items-center mt-8">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
                    <Eye className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900">
                    Real-time Data
                  </h4>
                  <p className="text-gray-600">
                    Reports update automatically as new transactions are
                    recorded.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Report Customization
                </h3>
                <div className="text-sm text-indigo-600 font-medium">
                  Options
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Date Range", value: "Last 30 days" },
                  { label: "Categories", value: "All categories" },
                  { label: "Chart Type", value: "Bar chart" },
                  { label: "Export Format", value: "PDF" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.value}
                    </span>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <button className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100">
                    Customize Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Use Financial Reports?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our users experience real benefits from using our comprehensive
              reporting tools.
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

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to gain financial clarity?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of users who are making better financial decisions
            with Money Nest's reporting tools.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 shadow-lg transition-all">
              Generate Reports
            </button>
            <button className="inline-flex items-center px-8 py-4 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-indigo-600 transition-all">
              View Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
