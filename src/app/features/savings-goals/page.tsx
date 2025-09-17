'use client';

import { useState } from "react";
import {
  Target,
  TrendingUp,
  Calendar,
  PiggyBank,
  Zap,
  Gift,
  Home,
  Car,
  GraduationCap,
  Download,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function SavingsGoals() {
  const [activeGoal, setActiveGoal] = useState("vacation");

  // Sample savings goals
  const goals = [
    {
      id: "vacation",
      name: "Dream Vacation",
      icon: <PiggyBank className="h-5 w-5" />,
      targetAmount: 5000,
      currentAmount: 3200,
      targetDate: "2023-12-15",
      monthlyContribution: 300,
    },
    {
      id: "emergency",
      name: "Emergency Fund",
      icon: <Target className="h-5 w-5" />,
      targetAmount: 10000,
      currentAmount: 7500,
      targetDate: "2024-03-20",
      monthlyContribution: 500,
    },
    {
      id: "car",
      name: "New Car",
      icon: <Car className="h-5 w-5" />,
      targetAmount: 25000,
      currentAmount: 8200,
      targetDate: "2024-08-10",
      monthlyContribution: 1000,
    },
  ];

  const features = [
    {
      icon: <Target className="h-8 w-8 text-indigo-600" />,
      title: "Goal Setting",
      description:
        "Set specific savings targets with custom amounts and deadlines.",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-indigo-600" />,
      title: "Progress Tracking",
      description:
        "Visualize your progress with charts and milestone celebrations.",
    },
    {
      icon: <Calendar className="h-8 w-8 text-indigo-600" />,
      title: "Auto-Savings",
      description: "Schedule automatic transfers to reach your goals faster.",
    },
    {
      icon: <Zap className="h-8 w-8 text-indigo-600" />,
      title: "Smart Recommendations",
      description:
        "Get personalized suggestions to optimize your savings strategy.",
    },
  ];

  const benefits = [
    {
      icon: <Gift className="h-6 w-6 text-indigo-600" />,
      title: "Achieve Dreams Faster",
      description:
        "Users with specific savings goals reach them 3x faster than those without.",
    },
    {
      icon: <Home className="h-6 w-6 text-indigo-600" />,
      title: "Financial Security",
      description:
        "Build emergency funds and save for major life events with confidence.",
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-indigo-600" />,
      title: "Develop Good Habits",
      description:
        "Regular saving becomes a habit that benefits all areas of your financial life.",
    },
  ];

  const goalCategories = [
    {
      name: "Vacation",
      icon: "🏖️",
      examples: "Beach trip, European tour, Family vacation",
    },
    {
      name: "Emergency Fund",
      icon: "🛡️",
      examples: "Medical expenses, Job loss, Car repairs",
    },
    {
      name: "Education",
      icon: "🎓",
      examples: "College fund, Courses, Student loans",
    },
    {
      name: "Home",
      icon: "🏠",
      examples: "Down payment, Renovations, New furniture",
    },
    {
      name: "Vehicle",
      icon: "🚗",
      examples: "Car purchase, Maintenance, Insurance",
    },
    {
      name: "Retirement",
      icon: "🌴",
      examples: "401k, IRA, Pension supplement",
    },
  ];

  const currentGoal = goals.find((goal) => goal.id === activeGoal) || goals[0];
  const progressPercentage = Math.min(
    100,
    (currentGoal.currentAmount / currentGoal.targetAmount) * 100
  );
  const monthsRemaining = Math.ceil(
    (new Date(currentGoal.targetDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Smart{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                Savings Goals
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Set, track, and achieve your financial dreams with Money Nest's
              goal-oriented savings tools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Turn Your Dreams into Reality
              </h2>
              <p className="text-gray-600 mb-4">
                Money Nest's savings goals help you visualize your financial
                targets, track progress, and stay motivated with milestone
                celebrations and smart recommendations.
              </p>
              <p className="text-gray-600 mb-4">
                Whether you're saving for a vacation, emergency fund, or down
                payment, our tools make it simple to turn aspirations into
                achievements.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <button className="inline-flex items-center px-6 py-3.5 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
                  Create Your First Goal
                  <Plus className="ml-2 h-5 w-5" />
                </button>
                <button className="inline-flex items-center px-6 py-3.5 text-base font-medium rounded-xl text-indigo-600 bg-white border border-indigo-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md">
                  View Examples
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Savings Progress
                  </h3>
                  <div className="text-sm text-indigo-600 font-medium">
                    {progressPercentage.toFixed(0)}% Complete
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">
                      ${currentGoal.currentAmount.toLocaleString()}
                    </span>
                    <span className="text-gray-700">
                      ${currentGoal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Monthly</div>
                    <div className="text-lg font-bold text-gray-900">
                      ${currentGoal.monthlyContribution}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">
                      Months Left
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {monthsRemaining}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Target Date</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(currentGoal.targetDate).toLocaleDateString()}
                    </div>
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
              Powerful Savings Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to set, track, and achieve your savings goals.
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

      {/* Goal Categories Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Save for What Matters Most
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whether big or small, short-term or long-term, Money Nest helps
              you save for what's important.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goalCategories.map((category, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all"
              >
                <div className="text-2xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600">{category.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Set Savings Goals?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our users experience real benefits from using our goal-oriented
              savings tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-gray-50 p-6 rounded-xl border border-gray-100"
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
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Savings Goals Work
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Getting started with Money Nest's savings goals is simple and
              effective.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Define Your Goal",
                description:
                  "Set a target amount, deadline, and give your goal a name.",
              },
              {
                step: "2",
                title: "Plan Contributions",
                description:
                  "Determine how much you'll save regularly to reach your target.",
              },
              {
                step: "3",
                title: "Track Progress",
                description:
                  "Watch your savings grow with visual progress indicators.",
              },
              {
                step: "4",
                title: "Celebrate Success",
                description:
                  "Reach your goal and enjoy the financial freedom you've created.",
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
            Ready to start achieving your financial dreams?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of users who are reaching their savings goals with
            Money Nest.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 shadow-lg transition-all">
              Create Your Goal
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
