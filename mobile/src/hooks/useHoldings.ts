// hooks/useHoldings.ts
// Wraps /api/holdings (list + create) and /api/portfolio (aggregate
// summary + allocation + recent activity). The Investments screen reads
// both: holdings drive the list, portfolio drives the hero + donut.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";

export type HoldingType =
  | "stock"
  | "mutual_fund"
  | "etf"
  | "fd"
  | "gold"
  | "ppf"
  | "crypto"
  | "real_estate"
  | "other";

export interface HoldingDoc {
  _id: string;
  userId: string;
  accountId: string;
  name: string;
  type: HoldingType;
  symbol?: string | null;
  quantity: number;
  avgCostPrice: number;
  currentPrice: number;
  priceUpdatedAt?: string;
  realizedPnL: number;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface PortfolioAllocation {
  type: string;
  value: number;
  count: number;
  percentage: number;
}

export interface PortfolioPayload {
  summary: PortfolioSummary;
  allocationByType: PortfolioAllocation[];
  recentActivity: Array<{
    _id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    type: string;
    holdingId?: { name?: string; symbol?: string; type?: HoldingType } | null;
  }>;
}

export interface CreateHoldingInput {
  /** Investment-type account to hold the holding. Optional — when
   *  omitted, the backend auto-creates a default "Brokerage" account
   *  on first use (Goals-style dedicated-account pattern). */
  accountId?: string;
  fromAccountId: string; // Cash/bank account funding the buy
  name: string;
  type: HoldingType;
  symbol?: string | null;
  quantity: number;
  pricePerUnit: number;
  date?: string; // YYYY-MM-DD; defaults to today server-side
}

export function useHolding(id: string | undefined) {
  return useQuery<HoldingDoc>({
    queryKey: ["holding", id],
    queryFn: () => api<HoldingDoc>(`/api/holdings/${id}`),
    enabled: !!id,
  });
}

export function useHoldings() {
  return useQuery<HoldingDoc[]>({
    queryKey: ["holdings"],
    queryFn: async () => {
      const env = await api<{ data: HoldingDoc[] }>("/api/holdings", {
        query: { limit: 200 },
        envelope: true,
      });
      return env.data;
    },
  });
}

export function usePortfolio() {
  return useQuery<PortfolioPayload>({
    queryKey: ["portfolio"],
    queryFn: () => api<PortfolioPayload>("/api/portfolio"),
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["holdings"] });
  qc.invalidateQueries({ queryKey: ["holding"] }); // also matches ["holding", id]
  qc.invalidateQueries({ queryKey: ["portfolio"] });
  qc.invalidateQueries({ queryKey: ["accounts"] });
  qc.invalidateQueries({ queryKey: ["transactions"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useAddHolding() {
  const qc = useQueryClient();
  return useMutation<HoldingDoc, ApiError, CreateHoldingInput>({
    mutationFn: (body) =>
      api<HoldingDoc>("/api/holdings", { method: "POST", body }),
    onSuccess: () => {
      invalidate(qc);
      useToast.getState().success("Investment added");
    },
    onError: (err) => useToast.getState().error("Couldn't add investment", err.message),
  });
}

// ── Buy more (adds qty, recomputes weighted avg cost) ──
export interface BuyHoldingInput {
  fromAccountId: string;
  quantity: number;
  pricePerUnit: number;
  date?: string;
}
export function useBuyHolding(id: string) {
  const qc = useQueryClient();
  return useMutation<HoldingDoc, ApiError, BuyHoldingInput>({
    mutationFn: (body) =>
      api<HoldingDoc>(`/api/holdings/${id}/buy`, { method: "POST", body }),
    onSuccess: () => {
      invalidate(qc);
      useToast.getState().success("Buy order recorded");
    },
    onError: (err) => useToast.getState().error("Buy failed", err.message),
  });
}

// ── Sell (reduces qty, accumulates realized P&L) ──
export interface SellHoldingInput {
  toAccountId: string;
  quantity: number;
  pricePerUnit: number;
  date?: string;
}
export function useSellHolding(id: string) {
  const qc = useQueryClient();
  return useMutation<HoldingDoc, ApiError, SellHoldingInput>({
    mutationFn: (body) =>
      api<HoldingDoc>(`/api/holdings/${id}/sell`, { method: "POST", body }),
    onSuccess: () => {
      invalidate(qc);
      useToast.getState().success("Sell order recorded");
    },
    onError: (err) => useToast.getState().error("Sell failed", err.message),
  });
}

// ── Update current price only (mark-to-market, no transaction) ──
export interface UpdatePriceInput {
  currentPrice: number;
}
export function useUpdatePrice(id: string) {
  const qc = useQueryClient();
  return useMutation<HoldingDoc, ApiError, UpdatePriceInput>({
    mutationFn: (body) =>
      api<HoldingDoc>(`/api/holdings/${id}/price`, { method: "POST", body }),
    onSuccess: () => invalidate(qc),
  });
}

// ── Edit non-financial metadata (name, symbol, notes) ──
export interface UpdateHoldingMetaInput {
  name?: string;
  symbol?: string | null;
  notes?: string | null;
}
export function useUpdateHoldingMeta(id: string) {
  const qc = useQueryClient();
  return useMutation<HoldingDoc, ApiError, UpdateHoldingMetaInput>({
    mutationFn: (body) =>
      api<HoldingDoc>(`/api/holdings/${id}`, { method: "PUT", body }),
    onSuccess: () => invalidate(qc),
  });
}

// ── Delete holding (history preserved) ──
export function useDeleteHolding() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => api(`/api/holdings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate(qc);
      useToast.getState().success("Investment deleted");
    },
    onError: (err) => useToast.getState().error("Couldn't delete", err.message),
  });
}
