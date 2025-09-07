"use client";

import { useState } from "react";
import {
  TrendingUp,
  PieChart,
  BarChart,
  DollarSign,
  Target,
  Shield,
  Zap,
  Calendar,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function InvestmentTracking() {
  const [activeTab, setActiveTab] = useState("portfolio");

  // Sample investment portfolio
  const portfolio = [
    { name: "Tech Stocks", value: 18500, change: 12.5, color: "bg-blue-500" },
    { name: "Index Funds", value: 12500, change: 8.2, color: "bg-green-500" },
    { name: "Real Estate", value: 7500, change: 5.7, color: "bg-yellow-500" },
    {
      name: "Cryptocurrency",
      value: 4200,
      change: -3.2,
      color: "bg-purple-500",
    },
    { name: "Bonds", value: 6800, change: 2.1, color: "bg-red-500" },
  ];

  // Sample performance data
  const performance = [
    { date: "1M", return: 5.2 },
    { date: "3M", return: 12.8 },
    { date: "6M", return: 18.3 },
    { date: "1Y", return: 24.7 },
    { date: "All", return: 42.5 },
  ];

  const features = [
    {
      icon: <PieChart className="h-8 w-8 text-indigo-600" />,
      title: "Portfolio Overview",
      description:
        "See all your investments in one place with real-time valuation and performance metrics.",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-indigo-600" />,
      title: "Performance Tracking",
      description:
        "Monitor returns across different time periods and compare against market benchmarks.",
    },
    {
      icon: <BarChart className="h-8 w-8 text-indigo-600" />,
      title: "Diversification Analysis",
      description:
        "Understand your asset allocation and identify opportunities to rebalance your portfolio.",
    },
    {
      icon: <Shield className="h-8 w-8 text-indigo-600" />,
      title: "Risk Assessment",
      description:
        "Evaluate your portfolio's risk profile and get recommendations for optimization.",
    },
  ];

  const benefits = [
    {
      icon: <Target className="h-6 w-6 text-indigo-600" />,
      title: "Better Returns",
      description:
        "Users who track investments with Money Nest see 23% better returns on average.",
    },
    {
      icon: <Zap className="h-6 w-6 text-indigo-600" />,
      title: "Time Saving",
      description:
        "Automated tracking saves investors 5+ hours per month on portfolio management.",
    },
    {
      icon: <Shield className="h-6 w-6 text-indigo-600" />,
      title: "Reduced Risk",
      description:
        "Get alerts for portfolio imbalances and opportunities to diversify.",
    },
  ];

  const totalValue = portfolio.reduce((sum, item) => sum + item.value, 0);
  const totalChange =
    (portfolio.reduce(
      (sum, item) => sum + (item.value * item.change) / 100,
      0
    ) /
      totalValue) *
    100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Smart{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                Investment Tracking
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Monitor, analyze, and optimize your investment portfolio with
              Money Nest's powerful tracking tools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Grow Your Wealth with Confidence
              </h2>
              <p className="text-gray-600 mb-4">
                Money Nest's investment tracking helps you monitor performance
                across all your accounts, analyze asset allocation, and make
                informed decisions to optimize your portfolio.
              </p>
              <p className="text-gray-600 mb-4">
                Whether you're managing stocks, bonds, crypto, or real estate,
                our tools provide the insights you need to build long-term
                wealth.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <button className="inline-flex items-center px-6 py-3.5 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
                  Track Investments
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
                    Portfolio Overview
                  </h3>
                  <div
                    className={`flex items-center text-sm ${
                      totalChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {totalChange >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    <span>
                      {totalChange >= 0 ? "+" : ""}
                      {totalChange.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    ${totalValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Total Portfolio Value
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {portfolio.map((investment, index) => {
                    const percentage = (investment.value / totalValue) * 100;
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">
                            {investment.name}
                          </span>
                          <span className="text-gray-900">
                            ${investment.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${investment.color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div
                          className={`flex justify-end text-xs ${
                            investment.change >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {investment.change >= 0 ? "+" : ""}
                          {investment.change}%
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Performance
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {performance.map((item, index) => (
                      <div key={index} className="text-center">
                        <div className="text-xs text-gray-500">{item.date}</div>
                        <div
                          className={`text-sm font-medium ${
                            item.return >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {item.return >= 0 ? "+" : ""}
                          {item.return}%
                        </div>
                      </div>
                    ))}
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
              Powerful Investment Tracking Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to monitor, analyze, and optimize your
              investment portfolio.
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
              Why Track Investments with Money Nest?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our users experience real financial benefits from using our
              investment tracking tools.
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
              How Investment Tracking Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Getting started with Money Nest's investment tracking is simple
              and effective.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Connect Accounts",
                description:
                  "Securely link your brokerage, retirement, and other investment accounts.",
              },
              {
                step: "2",
                title: "Track Performance",
                description:
                  "Monitor returns, dividends, and portfolio growth across all your investments.",
              },
              {
                step: "3",
                title: "Analyze Allocation",
                description:
                  "Review your asset allocation and identify diversification opportunities.",
              },
              {
                step: "4",
                title: "Optimize Strategy",
                description:
                  "Make informed decisions based on performance data and market trends.",
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
            Ready to optimize your investment strategy?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of investors who are building wealth with Money
            Nest's investment tracking.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 shadow-lg transition-all">
              Start Tracking
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
