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
  Target,
  Check,
  Star,
  Award,
  Shield,
  ChevronRight,
  PiggyBank,
} from "lucide-react";
import Navbar from "@/landingcomponents/Navbar";

export default function Landing() {
   const features = [
     {
       icon: <PieChart className="h-8 w-8 text-indigo-600" />,
       title: "Expense Tracking",
       description:
         "Track every dollar with automatic categorization and smart insights.",
       link: "/features/expense-tracking",
     },
     {
       icon: <Target className="h-8 w-8 text-indigo-600" />,
       title: "Budget Planning",
       description:
         "Create custom budgets and get alerts when you're approaching limits.",
       link: "/features/budget-planning",
     },
     {
       icon: <TrendingUp className="h-8 w-8 text-indigo-600" />,
       title: "Investment Tracking",
       description:
         "Monitor your portfolio performance and analyze investment returns.",
       link: "/features/investments",
     },
     {
       icon: <Bell className="h-8 w-8 text-indigo-600" />,
       title: "Bill Reminders",
       description:
         "Never miss a payment with smart alerts and automated reminders.",
       link: "/features/bill-reminders",
     },
     {
       icon: <Award className="h-8 w-8 text-indigo-600" />,
       title: "Financial Reports",
       description:
         "Generate comprehensive reports to understand your financial health.",
       link: "/features/reports",
     },
     {
       icon: <PiggyBank className="h-8 w-8 text-indigo-600" />,
       title: "Savings Goals",
       description:
         "Set, track, and achieve your financial targets with smart goal management.",
       link: "features/savings-goals",
     },
   ];

   const testimonials = [
     {
       quote:
         "Money Nest helped me save over $5,000 in my first year. The budgeting tools are incredible!",
       name: "Sarah Johnson",
       role: "Marketing Manager",
       rating: 5,
     },
     {
       quote:
         "I've tried countless finance apps, but Money Nest is the only one that actually helped me understand my spending.",
       name: "Michael Chen",
       role: "Software Engineer",
       rating: 5,
     },
     {
       quote:
         "As a freelancer, managing irregular income was stressful. Money Nest gave me peace of mind.",
       name: "Jessica Williams",
       role: "Graphic Designer",
       rating: 5,
     },
   ];

   const stats = [
     { value: "50,000+", label: "Active Users" },
     { value: "$2.3B+", label: "Assets Tracked" },
     { value: "98%", label: "Customer Satisfaction" },
     { value: "15+", label: "Countries Served" },
   ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Manage Your Money
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Money Nest combines powerful tools with intuitive design to help
                you take control of your financial life.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Link key={index} href={feature.link}>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-indigo-200 transition-all duration-300 hover:shadow-md group cursor-pointer">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <div className="flex items-center text-indigo-600 font-medium">
                      Learn more
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-blue-100 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How Money Nest Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Getting started with Money Nest is simple. Here's how you can
                transform your financial life in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Connect Your Accounts",
                  description:
                    "Securely link your bank, credit card, and investment accounts in minutes.",
                },
                {
                  step: "2",
                  title: "Track & Categorize",
                  description:
                    "Automatically categorize transactions and see where your money is going.",
                },
                {
                  step: "3",
                  title: "Achieve Your Goals",
                  description:
                    "Set budgets, track progress, and get insights to reach financial freedom.",
                },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full text-xl font-bold mb-6 mx-auto">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Trusted by Thousands of Users
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See what our users are saying about their experience with Money
                Nest.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-6">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center">
                    <div className="bg-gray-200 rounded-full w-12 h-12 flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
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
        </section>

        {/* Security Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Bank-Level Security for Your Peace of Mind
                </h2>
                <p className="text-gray-600 mb-6">
                  At Money Nest, we take security seriously. Your financial data
                  is protected with the same level of security used by major
                  banks.
                </p>
                <div className="space-y-4">
                  {[
                    "256-bit encryption for all data",
                    "Two-factor authentication",
                    "Regular security audits",
                    "SOC 2 compliance",
                    "Read-only access to your accounts",
                  ].map((item, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
                <div className="text-center">
                  <Shield className="h-16 w-16 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4">
                    Your Data is Safe With Us
                  </h3>
                  <p className="text-blue-100">
                    We never store your banking credentials and use bank-level
                    security protocols to ensure your information remains
                    protected at all times.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Financial Life?
            </h2>
            <p className="text-blue-100 text-xl max-w-2xl mx-auto mb-8">
              Join thousands of users who are taking control of their finances
              with Money Nest.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 shadow-lg transition-all"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center px-8 py-4 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-indigo-600 transition-all"
              >
                View Pricing
              </Link>
            </div>
            <p className="text-blue-100 text-sm mt-4">
              No credit card required. Start your free trial today.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
