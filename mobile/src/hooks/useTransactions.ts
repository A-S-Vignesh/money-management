// hooks/useTransactions.ts
// React Query wrappers around /api/transactions and /api/transactions/[id].
// `useTransactions` returns the paginated list; the mutation hooks
// invalidate the list AND the dashboard so balances update in lockstep.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@money-nest/shared";

export interface TransactionDoc {
  _id: string;
  userId: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  fromAccountId?: string | null;
  toAccountId?: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionsQuery {
  page?: number;
  limit?: number;
  type?: "all" | "income" | "expense" | "transfer";
  search?: string;
  account?: string;
  startDate?: string;
  endDate?: string;
}

interface TransactionsListResponse {
  data: TransactionDoc[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: { totalIncome: number; totalExpense: number; netFlow: number };
}

// /api/transactions returns `{ data, pagination, summary }` alongside the
// envelope's `success`/`type` fields. We request the full envelope so we
// keep all three.
async function fetchTransactions(
  query: TransactionsQuery,
): Promise<TransactionsListResponse> {
  const envelope = await api<{
    data: TransactionDoc[];
    pagination: TransactionsListResponse["pagination"];
    summary: TransactionsListResponse["summary"];
  }>("/api/transactions", {
    // Cast: TransactionsQuery is structurally compatible but has named
    // properties instead of an index signature, which trips strict TS.
    query: query as Record<string, string | number | boolean | undefined>,
    envelope: true,
  });
  return envelope;
}

export function useTransactions(query: TransactionsQuery = {}) {
  return useQuery<TransactionsListResponse>({
    queryKey: ["transactions", query],
    queryFn: () => fetchTransactions(query),
  });
}

// ── Mutations ────────────────────────────────────────────────────────────

function invalidateAfterMutation(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["transactions"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["reports"] });
  qc.invalidateQueries({ queryKey: ["accounts"] });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation<TransactionDoc, ApiError, CreateTransactionInput>({
    mutationFn: (body) =>
      api<TransactionDoc>("/api/transactions", { method: "POST", body }),
    onSuccess: () => invalidateAfterMutation(qc),
  });
}

export function useUpdateTransaction(id: string) {
  const qc = useQueryClient();
  return useMutation<TransactionDoc, ApiError, UpdateTransactionInput>({
    mutationFn: (body) =>
      api<TransactionDoc>(`/api/transactions/${id}`, {
        method: "PUT",
        body,
      }),
    onSuccess: () => invalidateAfterMutation(qc),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) =>
      api(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateAfterMutation(qc),
  });
}
