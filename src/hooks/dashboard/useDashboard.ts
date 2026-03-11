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

export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netChange: number;
  incomeChange: string | null;
  expenseChange: string | null;
  savingsRate: string;
  categoryBreakdown: CategoryItem[];
  recentTransactions: RecentTransaction[];
  goals: GoalItem[];
  activeBudgets: number;
  totalGoals: number;
  totalAccounts: number;
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
