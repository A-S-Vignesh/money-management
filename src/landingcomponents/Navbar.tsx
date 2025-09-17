"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const featuresItems = [
    { name: "Expense Tracking", href: "/features/expense-tracking" },
    { name: "Budget Planning", href: "/features/budget-planning" },
    { name: "Investment Tracking", href: "/features/investments" },
    { name: "Bill Reminders", href: "/features/bill-reminders" },
    { name: "Financial Reports", href: "/features/reports" },
    { name: "Savings Goals", href: "/features/savings-goals" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-15 md:h-20 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative w-45 md:w-60 h-15 md:h-20">
                <Image
                  src="/images/logo/mainlogo.png" // Update with your logo path
                  alt="MoneyManager Logo"
                  width={1500}
                  height={500}
                  className="rounded-lg"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 rounded-lg"
            >
              Home
            </Link>

            {/* Features Dropdown */}
            <div className="relative group">
              <button
                className="px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 rounded-lg flex items-center"
                onMouseEnter={() => setIsFeaturesOpen(true)}
                onMouseLeave={() => setIsFeaturesOpen(false)}
              >
                Features
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>

              {isFeaturesOpen && (
                <div
                  className="absolute left-0 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100"
                  onMouseEnter={() => setIsFeaturesOpen(true)}
                  onMouseLeave={() => setIsFeaturesOpen(false)}
                >
                  <div className="py-1">
                    {featuresItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-150"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/pricing"
              className="px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 rounded-lg"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 rounded-lg"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 rounded-lg"
            >
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* <Link
              href="/login"
              className="px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200"
            >
              Sign In
            </Link> */}
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>

            <div className="pt-2 pb-1">
              <button
                className="flex justify-between items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
              >
                Features
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isFeaturesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isFeaturesOpen && (
                <div className="pl-6 mt-1 space-y-1">
                  {featuresItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/pricing"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>

            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block px-3 py-2 mt-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
