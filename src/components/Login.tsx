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

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

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
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="text-center">
          <div className="mx-auto mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mx-auto">
              <Loader className="h-6 w-6 text-indigo-600 mx-auto mt-2" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Securing Your Account
          </h2>
          <p className="text-sm text-gray-500 max-w-sm px-6">
            We're verifying your credentials and setting up your financial dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-white lg:bg-gradient-to-br lg:from-gray-50 lg:to-gray-100 overflow-hidden">
      {/* Left Panel - Graphic Section (Hidden on Mobile for App Feel) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-white blur-3xl mix-blend-overlay"></div>
            <div className="absolute top-[60%] -left-[20%] w-[50%] h-[50%] rounded-full bg-blue-300 blur-3xl mix-blend-overlay"></div>
        </div>
        
        <div className="relative z-10">
          <div className="mt-16 max-w-md">
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Take Control of Your Financial Future
            </h1>
            <p className="text-indigo-100 text-lg">
              Access your personalized dashboard to track expenses, set budgets,
              and achieve your financial goals.
            </p>
          </div>
        </div>

        {/* Financial Graphics */}
        <div className="relative z-10 mt-16">
          <div className="grid grid-cols-2 gap-6 max-w-lg">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white font-medium">Account {item}</div>
                  <div className="bg-indigo-500/50 rounded-full w-10 h-10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="h-28 bg-gradient-to-tr from-white/5 to-white/20 rounded-xl flex items-center justify-center border border-white/10">
                  <BarChart className="h-10 w-10 text-white opacity-60" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-12 flex flex-wrap gap-6">
          {[
            {
              icon: <Lock className="h-5 w-5 text-indigo-300" />,
              text: "Bank-level Security",
            },
            {
              icon: <PieChart className="h-5 w-5 text-indigo-300" />,
              text: "Real-time Analytics",
            },
            {
              icon: <DollarSign className="h-5 w-5 text-indigo-300" />,
              text: "Free to Start",
            },
          ].map((item, index) => (
            <div key={index} className="flex items-center text-white font-medium">
              <div className="bg-white/10 p-2 rounded-lg mr-3 shadow-inner border border-white/10">{item.icon}</div>
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Native Mobile Login Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between h-[100dvh] mt-[max(env(safe-area-inset-top),16px)] pb-[env(safe-area-inset-bottom)] lg:py-0 overflow-y-auto no-scrollbar lg:justify-center">
        
        {/* Mobile Header Graphic */}
        <div className="flex-[0.8] flex flex-col items-center justify-center px-6 lg:hidden bg-gradient-to-b from-indigo-50 to-white relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-2xl opacity-50 -translate-y-10 translate-x-10 pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-100 rounded-full blur-2xl opacity-50 translate-y-10 -translate-x-10 pointer-events-none"></div>
           <div className="relative z-10 w-20 h-20 bg-white shadow-lg shadow-indigo-100/50 rounded-2xl flex items-center justify-center mb-4 border border-gray-50 transform rotate-3">
             <Image
                src={"/images/logo/mainlogo2.png"}
                alt="Money Nest Logo"
                width={50}
                height={50}
                className="w-12 h-12 drop-shadow-md"
              />
           </div>
           <h2 className="text-xl font-extrabold text-gray-900 text-center tracking-tight mb-1">Money Nest</h2>
           <p className="text-xs text-gray-500 font-medium text-center">Smart financial tracking</p>
        </div>

        {/* Desktop Header Content */}
        <div className="hidden lg:flex w-full items-center justify-center p-12 pb-0 mb-8">
           <div className="text-center w-full max-w-md">
            <div>
              <Link href={"/"} className="inline-block group">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow inline-block">
                  <Image
                    src={"/images/logo/mainlogo.png"}
                    alt="Money Nest Logo"
                    width={150}
                    height={50}
                    className="w-auto h-10"
                  />
                </div>
              </Link>
            </div>
            <div className="mt-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-500 font-medium">
                Log in to access your financial dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Login Area Core */}
        <div className="w-full px-6 lg:px-12 pb-6 lg:pb-0 flex flex-col justify-end lg:justify-center lg:items-center relative z-10 bg-white lg:bg-transparent rounded-t-3xl pt-6 lg:pt-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] lg:shadow-none lg:h-auto border-t border-gray-50 lg:border-none lg:w-full mt-auto">
            <div className="w-full max-w-md lg:bg-white lg:rounded-[2rem] lg:shadow-xl lg:p-10 lg:border lg:border-gray-100 mx-auto">
              
              <div className="mb-5 lg:hidden text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Let's sign you in.</h3>
                  <p className="text-xs text-gray-500 font-medium">Welcome back, you've been missed!</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 text-[14px] font-semibold rounded-xl text-white bg-gray-900 hover:bg-black transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  <svg className="h-4 w-4 bg-white rounded-full p-px" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="translate-y-px">Continue with Google</span>
                  {isLoading && <Loader className="w-3 h-3 animate-spin ml-2" />}
                </button>
              </div>

              <div className="relative mt-6 mb-5 hidden lg:block">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400 font-medium">
                    Or continue with email
                  </span>
                </div>
              </div>
              
              <div className="relative mt-5 mb-5 lg:hidden">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-400 font-medium text-[10px] uppercase tracking-widest">
                    Or
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="relative text-gray-400 focus-within:text-gray-600">
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3.5 bg-gray-50 border-0 outline-none ring-1 ring-inset ring-gray-200 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:bg-white transition-all text-[14px] font-medium text-gray-800 disabled:opacity-50 disabled:bg-gray-100"
                      placeholder="Email Address"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <div className="relative text-gray-400 focus-within:text-gray-600">
                    <input
                      type="password"
                      id="password"
                      className="w-full px-4 py-3.5 bg-gray-50 border-0 outline-none ring-1 ring-inset ring-gray-200 rounded-xl focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:bg-white transition-all text-[14px] font-medium text-gray-800 disabled:opacity-50 disabled:bg-gray-100"
                      placeholder="Password"
                      disabled
                    />
                  </div>
                  <div className="flex justify-end mt-1.5">
                     <a
                      href="#"
                      className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>

                <button
                  className="w-full flex items-center justify-center px-6 py-3.5 text-[14px] font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group mt-1"
                  disabled
                >
                  <span className="translate-y-px">Sign in securely</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-2 opacity-70 group-hover:opacity-100 transition-opacity translate-y-px" />
                </button>
              </div>
              
            </div>

            <div className="mt-5 mb-2 text-center lg:mt-8">
              <p className="text-[13px] font-medium text-gray-500">
                Don't have an account?{" "}
                <a
                  href="#"
                  className="font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Sign up
                </a>
              </p>
            </div>
        </div>
      </div>
    </div>
  );
}
