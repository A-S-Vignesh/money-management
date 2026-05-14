import { useQuery } from "@tanstack/react-query";

interface CategoryItem {
  category: string;
  amount: number;
  percentage: string;
}

interface GoalItem {
  _id: string;
  name: string;
  target: number;
  current: number;
  color: string;
  priority: string;
  deadline?: string;
  isCompleted: boolean;
}

interface RecentTransaction {
  _id: string;
  type: "income" | "expense" | "transfer";
  description: string;
  category: string;
  amount: number;
  date: string;
}

export interface MonthlyTrendPoint {
  day: number;
  label: string;
  income: number;
  expense: number;
  net: number | null;
}

export interface OnboardingState {
  dismissed: boolean;
  totalTransactions: number;
  totalAccounts: number;
  totalBudgets: number;
  totalGoals: number;
}

export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netChange: number;
  monthLabel: string;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  incomeChange: string | null;
  expenseChange: string | null;
  savingsRate: string;
  categoryBreakdown: CategoryItem[];
  monthlyTrend: MonthlyTrendPoint[];
  recentTransactions: RecentTransaction[];
  goals: GoalItem[];
  activeBudgets: number;
  totalGoals: number;
  totalAccounts: number;
  onboarding: OnboardingState;
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch dashboard data");
  }

  return json.data;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 60 * 1000, // cache for 1 minute — dashboard is overview data
    refetchOnWindowFocus: true,
  });
}
