import { useQuery } from "@tanstack/react-query";

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  realizedPnL: number;
  totalPnL: number;
  holdingsCount: number;
  activeHoldingsCount: number;
}

export interface AllocationSlice {
  type: string;
  value: number;
  count: number;
  percentage: number;
}

export interface RecentInvestmentActivity {
  _id: string;
  type: "income" | "expense" | "transfer";
  description: string;
  category: string;
  amount: number;
  date: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  holdingId?: {
    _id: string;
    name: string;
    symbol?: string | null;
    type: string;
  } | null;
}

export interface PortfolioData {
  summary: PortfolioSummary;
  allocationByType: AllocationSlice[];
  recentActivity: RecentInvestmentActivity[];
}

async function fetchPortfolio(): Promise<PortfolioData> {
  const res = await fetch("/api/portfolio");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch portfolio");
  }
  return json.data;
}

export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: fetchPortfolio,
    staleTime: 30_000,
  });
}
