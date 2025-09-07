"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DollarSign,
  PieChart,
  Lock,
  Loader,
  CreditCard,
  BarChart,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("google");
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="text-center">
          <div className="mx-auto mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto">
              <Loader className="h-8 w-8 text-indigo-600 mx-auto mt-3" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Securing Your Account
          </h2>
          <p className="text-gray-600 max-w-md">
            We're verifying your credentials and setting up your financial
            dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (session) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Left Panel - Graphic Section */}
      <div className="lg:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-700 p-8 lg:p-12 flex flex-col justify-between">
        <div>
          <div className="flex items-center">
            {/* <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-white">
              MoneyManager
            </span> */}
          </div>

          <div className="mt-16 max-w-md">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Take Control of Your Financial Future
            </h1>
            <p className="text-blue-100 text-lg">
              Access your personalized dashboard to track expenses, set budgets,
              and achieve your financial goals.
            </p>
          </div>
        </div>

        {/* Financial Graphics */}
        <div className="hidden lg:block mt-16">
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white font-medium">Account {item}</div>
                  <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-lg flex items-center justify-center">
                  <BarChart className="h-12 w-12 text-white opacity-70" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          {[
            {
              icon: <Lock className="h-5 w-5 text-white" />,
              text: "Bank-level Security",
            },
            {
              icon: <PieChart className="h-5 w-5 text-white" />,
              text: "Real-time Analytics",
            },
            {
              icon: <DollarSign className="h-5 w-5 text-white" />,
              text: "Free to Start",
            },
          ].map((item, index) => (
            <div key={index} className="flex items-center text-white/90">
              {item.icon}
              <span className="ml-2 text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div>
            <Link href={"/"}>
              <Image
                src={"/images/logo/mainlogo.png"}
                alt="Money Nest Logo"
                width={1500}
                height={500}
              />
            </Link>
          </div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to access your financial dashboard
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                Sign in with
              </h3>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 mt-4 text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="#fff"
                    d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                  />
                </svg>
                Google
              </button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  More options coming soon
                </span>
              </div>
            </div>

            <div className="space-y-4 opacity-50 pointer-events-none">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="you@example.com"
                  disabled
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot?
                  </a>
                </div>
                <input
                  type="password"
                  id="password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                  disabled
                />
              </div>

              <button
                className="w-full flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-xl text-white bg-gray-400"
                disabled
              >
                Sign in
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <a
                href="#"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
