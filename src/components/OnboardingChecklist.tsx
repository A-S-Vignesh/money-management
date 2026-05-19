// components/OnboardingChecklist.tsx
//
// First-run welcome card. Shows up at the top of the Dashboard until the user
// either completes every task OR explicitly dismisses it.
//
// Each task is auto-checked from real data (account count, transaction count,
// etc.) — there's no separate "mark as done" state. That means the user can
// never desynchronize the checklist from reality.
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  CreditCard,
  PieChart,
  PlusCircle,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { useQueryClient } from "@tanstack/react-query";
import type { OnboardingState } from "@/hooks/dashboard/useDashboard";

interface Step {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  done: boolean;
}

export default function OnboardingChecklist({
  state,
}: {
  state: OnboardingState;
}) {
  const [hidden, setHidden] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const showToast = useToastStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const steps: Step[] = [
    {
      key: "account",
      label: "Add your first account",
      description: "A bank, wallet or cash account to track money in.",
      href: "/dashboard/balance",
      icon: <CreditCard size={16} />,
      done: state.totalAccounts > 0,
    },
    {
      key: "transaction",
      label: "Record your first transaction",
      description: "Log an income or expense — that's where insights begin.",
      href: "/dashboard/transactions",
      icon: <PlusCircle size={16} />,
      done: state.totalTransactions > 0,
    },
    {
      key: "budget",
      label: "Create a budget (optional)",
      description: "Set monthly spending limits per category.",
      href: "/dashboard/budgets",
      icon: <PieChart size={16} />,
      done: state.totalBudgets > 0,
    },
    {
      key: "goal",
      label: "Set a financial goal (optional)",
      description: "Saving for something? Track it alongside your accounts.",
      href: "/dashboard/goals",
      icon: <Target size={16} />,
      done: state.totalGoals > 0,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = completed === total;

  // Card stays hidden once dismissed by the user this session, OR once the
  // server flag is true, OR once every step is done.
  if (hidden || state.dismissed || allDone) return null;

  const dismiss = async () => {
    setDismissing(true);
    setHidden(true); // optimistic — feels instant
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingDismissed: true }),
      });
      if (!res.ok) throw new Error();
      // Refresh dashboard so the server-side dismissed flag is cached
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      // Revert optimistic hide so user can try again
      setHidden(false);
      showToast("Couldn't dismiss — try again", "error");
    } finally {
      setDismissing(false);
    }
  };

  const pct = (completed / total) * 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 md:p-6 shadow-sm">
      {/* Decorative sparkle */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-200/30 rounded-full blur-2xl pointer-events-none" />

      {/* Dismiss */}
      <button
        onClick={dismiss}
        disabled={dismissing}
        aria-label="Dismiss welcome card"
        className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-white/70 transition-colors disabled:opacity-50"
      >
        <X size={16} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-white dark:bg-gray-900 shadow-sm border border-indigo-100 p-2 rounded-xl">
          <Sparkles className="text-indigo-600 dark:text-indigo-300" size={20} />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Welcome to Money Nest
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            A few quick steps to get the most out of the app.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {completed} of {total} complete
          </span>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
            {Math.round(pct)}%
          </span>
        </div>
        <div className="w-full bg-white/70 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {steps.map((step) => (
          <StepRow key={step.key} step={step} />
        ))}
      </div>
    </div>
  );
}

function StepRow({ step }: { step: Step }) {
  const className = `group flex items-center gap-3 p-3 rounded-xl border transition-all ${
    step.done
      ? "bg-white/60 border-green-200"
      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:shadow-sm"
  }`;

  const inner = (
    <>
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          step.done
            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
            : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 group-hover:bg-indigo-200"
        }`}
      >
        {step.done ? <Check size={16} strokeWidth={3} /> : step.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            step.done
              ? "text-gray-500 dark:text-gray-400 line-through"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {step.label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{step.description}</p>
      </div>
    </>
  );

  // Done items don't navigate (already there); pending items link to action
  return step.done ? (
    <div className={className}>{inner}</div>
  ) : (
    <Link href={step.href} className={className}>
      {inner}
    </Link>
  );
}
