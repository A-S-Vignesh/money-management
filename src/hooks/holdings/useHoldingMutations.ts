// hooks/holdings/useHoldingMutations.ts
//
// All mutating operations for Holdings live here so the page can import
// once and pick what it needs. Each mutation invalidates the right queries
// (holdings, portfolio, accounts, transactions, dashboard) so the UI stays
// in sync after a buy/sell/etc.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";
import type {
  CreateHoldingInput,
  UpdateHoldingInput,
  BuyHoldingInput,
  SellHoldingInput,
  UpdatePriceInput,
} from "@/validations/holding";

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["holdings"] });
  qc.invalidateQueries({ queryKey: ["portfolio"] });
  // Buys/sells move money between accounts → these caches are now stale
  qc.invalidateQueries({ queryKey: ["accounts"] });
  qc.invalidateQueries({ queryKey: ["transactions"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["reports"] });
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

async function putJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

async function del<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

interface ApiResponse<T = unknown> {
  message: string;
  type: "success" | "error";
  success: boolean;
  data?: T;
}

export function useCreateHolding() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  return useMutation({
    mutationFn: (data: CreateHoldingInput) =>
      postJson<ApiResponse>("/api/holdings", data),
    onSuccess: (res) => {
      showToast(res.message, "success");
      invalidateAll(qc);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });
}

export function useUpdateHolding() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHoldingInput }) =>
      putJson<ApiResponse>(`/api/holdings/${id}`, data),
    onSuccess: (res) => {
      showToast(res.message, "success");
      invalidateAll(qc);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });
}

export function useDeleteHolding() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  return useMutation({
    mutationFn: (id: string) => del<ApiResponse>(`/api/holdings/${id}`),
    onSuccess: (res) => {
      showToast(res.message, "success");
      invalidateAll(qc);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });
}

export function useBuyHolding() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BuyHoldingInput }) =>
      postJson<ApiResponse>(`/api/holdings/${id}/buy`, data),
    onSuccess: (res) => {
      showToast(res.message, "success");
      invalidateAll(qc);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });
}

export function useSellHolding() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SellHoldingInput }) =>
      postJson<ApiResponse>(`/api/holdings/${id}/sell`, data),
    onSuccess: (res) => {
      showToast(res.message, "success");
      invalidateAll(qc);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });
}

export function useUpdateHoldingPrice() {
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePriceInput }) =>
      postJson<ApiResponse>(`/api/holdings/${id}/price`, data),
    onSuccess: (res) => {
      showToast(res.message, "success");
      invalidateAll(qc);
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });
}
