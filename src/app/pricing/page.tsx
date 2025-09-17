"use client";

import Link from "next/link";
import {
  Check,
  DollarSign,
  Zap,
  Crown,
  Building,
  HelpCircle,
} from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for individuals getting started",
      price: "Free",
      pricePeriod: "",
      popular: false,
      cta: "Get Started",
      href: "/login",
      features: [
        "Track up to 3 accounts",
        "Basic expense tracking",
        "Monthly budget planning",
        "Email support",
        "Standard reports",
      ],
      icon: <DollarSign className="h-8 w-8 text-blue-500" />,
    },
    {
      name: "Professional",
      description: "Best for serious budgeters and investors",
      price: "$9",
      pricePeriod: "/month",
      popular: true,
      cta: "Start Free Trial",
      href: "/login?plan=pro",
      features: [
        "Unlimited accounts",
        "Automated expense tracking",
        "Advanced analytics",
        "Investment tracking",
        "Bill reminders",
        "Priority support",
        "Custom categories",
        "Data export",
      ],
      icon: <Zap className="h-8 w-8 text-indigo-600" />,
    },
    {
      name: "Enterprise",
      description: "For businesses and financial teams",
      price: "$24",
      pricePeriod: "/month",
      popular: false,
      cta: "Contact Sales",
      href: "/contact",
      features: [
        "All Professional features",
        "Team management",
        "Shared budgets",
        "Advanced reporting",
        "White-label options",
        "API access",
        "Dedicated account manager",
        "SAML SSO",
      ],
      icon: <Building className="h-8 w-8 text-purple-600" />,
    },
  ];

  const faqs = [
    {
      question: "Can I change plans anytime?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. When upgrading, the new rate applies immediately. When downgrading, the change takes effect at the end of your billing cycle.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "Yes, our Professional plan comes with a 14-day free trial. No credit card required to start. The Starter plan is free forever with basic features.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, PayPal, and for annual plans we also support bank transfers.",
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer:
        "Yes, we offer 20% discount when you choose annual billing for our Professional and Enterprise plans.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Simple, Transparent{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
            Pricing
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose the plan that works best for you. All plans include core
          features with no hidden fees.
        </p>
      </div>

      {/* Pricing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button className="px-4 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-indigo-600">
            Monthly
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-indigo-600">
            Annual (Save 20%)
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl border-2 ${
                plan.popular
                  ? "border-indigo-500 shadow-xl relative"
                  : "border-gray-200"
              } bg-white transition-all hover:shadow-lg`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div
                className={`p-8 ${
                  plan.popular ? "bg-indigo-50" : ""
                } rounded-t-2xl`}
              >
                <div className="flex items-center mb-4">
                  {plan.icon}
                  <h3 className="ml-3 text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.pricePeriod && (
                    <span className="ml-1 text-gray-600">
                      {plan.pricePeriod}
                    </span>
                  )}
                </div>

                <Link
                  href={plan.href}
                  className={`w-full block text-center px-6 py-3 rounded-lg font-medium ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  } transition-all duration-300`}
                >
                  {plan.cta}
                </Link>
              </div>

              <div className="p-8 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Features
                </h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Compare Plans
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See how our plans stack up against each other to find the right fit
            for your needs.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  Features
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                  Starter
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                  Professional
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                {
                  feature: "Number of accounts",
                  starter: "3",
                  pro: "Unlimited",
                  enterprise: "Unlimited",
                },
                {
                  feature: "Automated transaction sync",
                  starter: "❌",
                  pro: "✅",
                  enterprise: "✅",
                },
                {
                  feature: "Investment tracking",
                  starter: "❌",
                  pro: "✅",
                  enterprise: "✅",
                },
                {
                  feature: "Budget categories",
                  starter: "5",
                  pro: "Unlimited",
                  enterprise: "Unlimited",
                },
                {
                  feature: "Custom reports",
                  starter: "❌",
                  pro: "✅",
                  enterprise: "✅",
                },
                {
                  feature: "Team members",
                  starter: "1",
                  pro: "1",
                  enterprise: "Up to 10",
                },
                {
                  feature: "Priority support",
                  starter: "❌",
                  pro: "✅",
                  enterprise: "✅",
                },
                {
                  feature: "Data export",
                  starter: "❌",
                  pro: "✅",
                  enterprise: "✅",
                },
                {
                  feature: "API access",
                  starter: "❌",
                  pro: "❌",
                  enterprise: "✅",
                },
              ].map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {row.feature}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700">
                    {row.starter}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700">
                    {row.pro}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700">
                    {row.enterprise}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about our pricing and plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-start">
                <HelpCircle className="h-6 w-6 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            Still have questions? We're here to help!
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            Contact Support
          </Link>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to take control of your finances?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of users who have saved an average of $3,000 in their
            first year with MoneyManager.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 shadow-lg"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
