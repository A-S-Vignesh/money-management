import { useQuery } from "@tanstack/react-query";
import type { HoldingType } from "@/validations/holding";

export interface PopulatedAccountRef {
  _id: string;
  name: string;
  type: string;
}

export interface Holding {
  _id: string;
  userId: string;
  accountId: string | PopulatedAccountRef;
  name: string;
  type: HoldingType;
  symbol?: string | null;
  quantity: number;
  avgCostPrice: number;
  currentPrice: number;
  priceUpdatedAt: string;
  realizedPnL: number;
  maturityDate?: string | null;
  interestRate?: number | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

async function fetchHoldings(includeInactive: boolean): Promise<Holding[]> {
  const url = includeInactive
    ? "/api/holdings?includeInactive=1"
    : "/api/holdings";
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch holdings");
  }
  return json.data;
}

export function useHoldings(opts: { includeInactive?: boolean } = {}) {
  const includeInactive = !!opts.includeInactive;
  return useQuery({
    queryKey: ["holdings", { includeInactive }],
    queryFn: () => fetchHoldings(includeInactive),
    staleTime: 30_000,
  });
}
