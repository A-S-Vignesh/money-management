import Link from "next/link";
import {
  DollarSign,
  ArrowRight,
  PieChart,
  Bell,
  Lock,
  CreditCard,
  BarChart,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  Calendar,
  Users,
  ChevronRight,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-800">
                MoneyManager
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-gray-600 hover:text-indigo-600 font-medium"
              >
                Features
              </Link>
              <Link
                href="#testimonials"
                className="text-gray-600 hover:text-indigo-600 font-medium"
              >
                Testimonials
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 hover:text-indigo-600 font-medium"
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                className="text-gray-600 hover:text-indigo-600 font-medium"
              >
                FAQ
              </Link>
            </div>
            <div>
              <Link
                href="/login"
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
              Take Control of Your{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                Finances
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
              Money Manager helps you track expenses, analyze spending patterns,
              set budgets, and achieve your financial goals with powerful,
              intuitive tools.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-xl text-indigo-600 bg-white border border-indigo-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md"
              >
                Explore Features
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="mt-8 flex items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-800 font-medium"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">
                  Join <span className="font-semibold">15,000+</span> satisfied
                  users
                </p>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-800">
                          Monthly Overview
                        </h3>
                        <p className="text-sm text-gray-500">July 2023</p>
                      </div>
                    </div>
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      +12.5%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm mb-1">Income</p>
                      <p className="font-bold text-gray-800">$4,850</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm mb-1">Expenses</p>
                      <p className="font-bold text-gray-800">$2,920</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm mb-1">Savings</p>
                      <p className="font-bold text-gray-800">$1,930</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm mb-1">Investments</p>
                      <p className="font-bold text-gray-800">$450</p>
                    </div>
                  </div>

                  <div className="h-32 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-indigo-600 font-medium">
                        Spending Analysis
                      </p>
                      <div className="mt-2 flex items-center justify-center space-x-1">
                        {[30, 60, 45, 80, 55, 70].map((height, index) => (
                          <div
                            key={index}
                            className={`w-3 rounded-t ${
                              index === 3 ? "bg-indigo-600" : "bg-indigo-300"
                            }`}
                            style={{ height: `${height / 2}px` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-200 rounded-full opacity-20"></div>
            <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-blue-200 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features to Manage Your Money
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to take control of your finances in one
              intuitive platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <PieChart className="w-10 h-10 text-indigo-600" />,
                title: "Visual Analytics",
                desc: "Interactive charts and reports to visualize your income, expenses, and savings patterns.",
                highlight: "Understand your finances at a glance",
              },
              {
                icon: <Bell className="w-10 h-10 text-indigo-600" />,
                title: "Smart Alerts",
                desc: "Get notified about unusual spending, bill due dates, and budget limits.",
                highlight: "Never miss a payment again",
              },
              {
                icon: <Lock className="w-10 h-10 text-indigo-600" />,
                title: "Bank-Level Security",
                desc: "256-bit encryption and multi-factor authentication to keep your data safe.",
                highlight: "Your financial data is protected",
              },
              {
                icon: <CreditCard className="w-10 h-10 text-indigo-600" />,
                title: "Expense Tracking",
                desc: "Automatically categorize transactions and track spending across all accounts.",
                highlight: "Know where every dollar goes",
              },
              {
                icon: <BarChart className="w-10 h-10 text-indigo-600" />,
                title: "Budget Planning",
                desc: "Create custom budgets and receive alerts when you're approaching limits.",
                highlight: "Achieve your savings goals",
              },
              {
                icon: <TrendingUp className="w-10 h-10 text-indigo-600" />,
                title: "Investment Tracking",
                desc: "Monitor your investment portfolio and analyze performance over time.",
                highlight: "Grow your wealth confidently",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 transition-all hover:shadow-md"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-3">{feature.desc}</p>
                <p className="text-indigo-600 font-medium">
                  {feature.highlight}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 md:p-12 text-white">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 mb-8 md:mb-0">
                <h3 className="text-2xl md:text-3xl font-bold mb-3">
                  Ready to transform your financial life?
                </h3>
                <p className="text-blue-100 max-w-xl">
                  Join thousands of users who have saved an average of $500 in
                  their first three months.
                </p>
              </div>
              <div className="md:w-1/3 flex justify-center md:justify-end">
                <Link
                  href="/login"
                  className="px-8 py-3.5 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hear from our users who have transformed their financial lives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "Money Manager helped me pay off $15,000 in debt and start saving for the first time in my life. The budgeting tools are incredible!",
                name: "Sarah Johnson",
                role: "Marketing Manager",
              },
              {
                quote:
                  "I've tried countless budgeting apps, but Money Manager is the only one that actually helped me understand where my money was going.",
                name: "Michael Chen",
                role: "Software Engineer",
              },
              {
                quote:
                  "As a freelancer, managing irregular income was stressful. Money Manager's forecasting tools gave me peace of mind and helped me save consistently.",
                name: "Jessica Williams",
                role: "Graphic Designer",
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="text-yellow-400 mb-4">{"★".repeat(5)}</div>
                <p className="text-gray-700 italic mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works best for you. All plans include core
              features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "Free",
                desc: "Perfect for getting started",
                features: [
                  "Track up to 3 accounts",
                  "Basic expense tracking",
                  "Monthly budget",
                  "Email support",
                  "Limited reports",
                ],
              },
              {
                name: "Pro",
                price: "$6.99",
                period: "/month",
                desc: "Best for serious budgeters",
                popular: true,
                features: [
                  "Unlimited accounts",
                  "Advanced analytics",
                  "Custom budgets",
                  "Bill reminders",
                  "Investment tracking",
                  "Priority support",
                ],
              },
              {
                name: "Family",
                price: "$12.99",
                period: "/month",
                desc: "Ideal for households",
                features: [
                  "All Pro features",
                  "Up to 5 users",
                  "Shared budgets",
                  "Child accounts",
                  "Family financial reports",
                  "Dedicated account manager",
                ],
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border-2 ${
                  plan.popular
                    ? "border-indigo-500 shadow-xl relative"
                    : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div
                  className={`p-6 ${
                    plan.popular ? "bg-indigo-50" : ""
                  } rounded-t-2xl`}
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="ml-1 text-gray-600">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2">{plan.desc}</p>
                </div>
                <div className="p-6 border-t border-gray-200">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-green-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <p className="ml-3 text-gray-700">{feature}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link
                      href="/signup"
                      className={`w-full block text-center px-4 py-3 rounded-lg font-medium ${
                        plan.popular
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Everything you need to know about Money Manager.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "Is my financial data secure?",
                answer:
                  "Absolutely. We use bank-grade 256-bit encryption and never store your banking credentials. Your data is always protected with multiple layers of security.",
              },
              {
                question: "Can I connect my bank accounts?",
                answer:
                  "Yes, Money Manager supports over 10,000 financial institutions in the US and Canada. Connecting your accounts is simple and secure.",
              },
              {
                question: "How much time does it take to set up?",
                answer:
                  "You can be up and running in under 5 minutes. Our setup wizard guides you through the process, and you can start tracking expenses immediately.",
              },
              {
                question: "Can I use Money Manager with my family?",
                answer:
                  "Yes, our Family plan allows up to 5 users to share budgets and track expenses together while maintaining individual privacy for personal spending.",
              },
              {
                question: "What if I need help?",
                answer:
                  "We offer comprehensive help documentation, video tutorials, and email support. Pro subscribers get priority support with faster response times.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button className="w-full flex justify-between items-center p-6 text-left">
                  <span className="text-lg font-medium text-gray-900">
                    {faq.question}
                  </span>
                  <svg
                    className="h-6 w-6 text-indigo-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div className="px-6 pb-6 text-gray-600">{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-8 h-8 rounded flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">MoneyManager</span>
              </div>
              <p className="mt-4 text-gray-400">
                Take control of your finances and build a secure financial
                future with our powerful tools.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#features"
                    className="text-gray-400 hover:text-white"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-gray-400 hover:text-white"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-gray-400 hover:text-white"
                  >
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Mobile App
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Guides
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Webinars
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    Partners
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © 2023 MoneyManager. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
