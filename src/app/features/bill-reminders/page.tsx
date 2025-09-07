"use client";

import { useState } from "react";
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Repeat,
  Zap,
  Shield,
  Mail,
} from "lucide-react";

export default function BillReminders() {
  const [activeTab, setActiveTab] = useState("upcoming");

  // Sample bill data
  const bills = [
    {
      id: 1,
      name: "Electricity Bill",
      amount: 125.75,
      dueDate: "2023-10-20",
      status: "upcoming",
      category: "Utilities",
    },
    {
      id: 2,
      name: "Netflix Subscription",
      amount: 15.99,
      dueDate: "2023-10-22",
      status: "upcoming",
      category: "Entertainment",
    },
    {
      id: 3,
      name: "Car Payment",
      amount: 325.0,
      dueDate: "2023-10-25",
      status: "upcoming",
      category: "Transportation",
    },
    {
      id: 4,
      name: "Internet Bill",
      amount: 79.99,
      dueDate: "2023-10-05",
      status: "paid",
      category: "Utilities",
    },
    {
      id: 5,
      name: "Credit Card Payment",
      amount: 220.5,
      dueDate: "2023-09-28",
      status: "paid",
      category: "Credit",
    },
  ];

  const features = [
    {
      icon: <Bell className="h-8 w-8 text-indigo-600" />,
      title: "Smart Reminders",
      description:
        "Get notified before bills are due with customizable alerts via email, push, or SMS.",
    },
    {
      icon: <Calendar className="h-8 w-8 text-indigo-600" />,
      title: "Auto-Scheduling",
      description:
        "Set up recurring bills once and let Money Nest handle the reminders automatically.",
    },
    {
      icon: <CreditCard className="h-8 w-8 text-indigo-600" />,
      title: "Payment Tracking",
      description:
        "Keep track of which bills you've paid and which are still pending.",
    },
    {
      icon: <Shield className="h-8 w-8 text-indigo-600" />,
      title: "Late Fee Prevention",
      description:
        "Avoid costly late fees with timely reminders and payment confirmations.",
    },
  ];

  const benefits = [
    {
      icon: <Zap className="h-6 w-6 text-indigo-600" />,
      title: "Save Time",
      description:
        "Users save an average of 3 hours per month on bill management with our tools.",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-indigo-600" />,
      title: "Never Miss a Payment",
      description:
        "92% of users report never paying a late fee after using our reminder system.",
    },
    {
      icon: <Clock className="h-6 w-6 text-indigo-600" />,
      title: "Reduce Stress",
      description:
        "Automate your bill management and eliminate the worry of forgetting payments.",
    },
  ];

  const upcomingBills = bills.filter((bill) => bill.status === "upcoming");
  const paidBills = bills.filter((bill) => bill.status === "paid");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Smart{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                Bill Reminders
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Never miss a payment again with Money Nest's intelligent bill
              tracking and reminder system.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Stay On Top of Your Bills
              </h2>
              <p className="text-gray-600 mb-4">
                Money Nest's bill reminders help you track due dates, schedule
                payments, and avoid late fees with smart notifications and
                automated tracking.
              </p>
              <p className="text-gray-600 mb-4">
                Whether you have monthly subscriptions, quarterly payments, or
                annual renewals, our system ensures you're always prepared and
                never surprised by a due date.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <button className="inline-flex items-center px-6 py-3.5 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
                  Set Up Reminders
                  <Bell className="ml-2 h-5 w-5" />
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
                    Upcoming Bills
                  </h3>
                  <div className="text-sm text-indigo-600 font-medium">
                    3 bills due this month
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {upcomingBills.map((bill) => {
                    const daysUntilDue = Math.ceil(
                      (new Date(bill.dueDate).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                            <CreditCard className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {bill.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {bill.category}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            ${bill.amount}
                          </div>
                          <div
                            className={`text-xs ${
                              daysUntilDue <= 3
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          >
                            Due in {daysUntilDue} days
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">Monthly total</div>
                    <div className="text-lg font-bold text-gray-900">
                      $466.74
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
              Powerful Bill Management Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to stay on top of your bills and avoid late
              payments.
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
                How Reminders Work
              </h2>
              <p className="text-gray-600 mb-4">
                Money Nest's bill reminder system helps you stay organized with
                customizable alerts that notify you before bills are due, giving
                you plenty of time to make payments.
              </p>
              <p className="text-gray-600 mb-4">
                You can set different notification preferences for each bill,
                choose how far in advance to be reminded, and even track payment
                history for better financial planning.
              </p>
              <div className="flex items-center mt-8">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
                    <Mail className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-900">
                    Multiple Notification Channels
                  </h4>
                  <p className="text-gray-600">
                    Get reminders via email, push notifications, or SMS text
                    messages.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Notification Settings
                </h3>
                <div className="text-sm text-indigo-600 font-medium">
                  Customizable
                </div>
              </div>
              <div className="space-y-6">
                {[
                  { type: "Email", enabled: true, timing: "7 days before" },
                  {
                    type: "Push Notification",
                    enabled: true,
                    timing: "3 days before",
                  },
                  { type: "SMS Alert", enabled: false, timing: "1 day before" },
                ].map((setting, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-lg mr-3 ${
                          setting.enabled
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {setting.type === "Email" && (
                          <Mail className="h-4 w-4" />
                        )}
                        {setting.type === "Push Notification" && (
                          <Bell className="h-4 w-4" />
                        )}
                        {setting.type === "SMS Alert" && (
                          <Mail className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {setting.type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {setting.timing}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked={setting.enabled}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Use Bill Reminders?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our users experience real financial benefits from using our bill
              reminder system.
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

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to never miss a bill again?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of users who are saving time and money with Money
            Nest's bill reminders.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 shadow-lg transition-all">
              Get Started
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
