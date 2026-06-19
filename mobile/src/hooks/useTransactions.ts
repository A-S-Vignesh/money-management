// hooks/useTransactions.ts
// React Query wrappers around /api/transactions and /api/transactions/[id].
// `useTransactions` returns the paginated list; the mutation hooks
// invalidate the list AND the dashboard so balances update in lockstep.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { notifyBudgetCrossed } from "@/lib/notifications";
import type { BudgetDoc } from "./useBudgets";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/_shared";

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

// ── Infinite scroll variant ─────────────────────────────────────────────
// Used by the Transactions screen for scroll-based pagination. Pages in
// 20 items at a time and exposes fetchNextPage / hasNextPage for the
// SectionList's onEndReached handler.

export type InfiniteTransactionsQuery = Omit<TransactionsQuery, "page" | "limit">;

export function useInfiniteTransactions(query: InfiniteTransactionsQuery = {}) {
  return useInfiniteQuery<TransactionsListResponse>({
    queryKey: ["transactions-infinite", query],
    queryFn: ({ pageParam }) =>
      fetchTransactions({ ...query, page: pageParam as number, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

// ── Mutations ────────────────────────────────────────────────────────────

function invalidateAfterMutation(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["transactions"] });
  qc.invalidateQueries({ queryKey: ["transactions-infinite"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["reports"] });
  qc.invalidateQueries({ queryKey: ["accounts"] });
}

// If the new expense pushes a tracked budget across the 80% warning or
// 100% blown band, fire a local OS notification. We evaluate against
// the cached `spent` PLUS the new amount because the budgets cache is
// only just being invalidated and hasn't refetched yet.
//
// No-op when the budget cache hasn't been loaded (user never opened the
// Budgets screen). Server-driven push can cover that case later; this
// only handles what the client can see locally.
function maybeFireBudgetAlert(
  qc: ReturnType<typeof useQueryClient>,
  tx: TransactionDoc,
) {
  if (tx.type !== "expense") return;

  const txTs = new Date(tx.date).getTime();
  const queries = qc.getQueriesData<BudgetDoc[]>({ queryKey: ["budgets"] });
  let target: BudgetDoc | undefined;
  // Walk every cached "budgets" list (one per period filter the user
  // has visited) and grab the first budget whose category + active
  // window contains this transaction.
  for (const [, budgets] of queries) {
    if (!budgets) continue;
    target = budgets.find(
      (b) =>
        b.category === tx.category &&
        new Date(b.startDate).getTime() <= txTs &&
        new Date(b.endDate).getTime() >= txTs,
    );
    if (target) break;
  }
  if (!target || target.allocated <= 0) return;

  const prevSpent = target.spent ?? 0;
  const newSpent = prevSpent + tx.amount;
  const prevPct = prevSpent / target.allocated;
  const newPct = newSpent / target.allocated;

  // Only fire on the *crossing*, not on every expense above the band —
  // notifyBudgetCrossed has its own cooldown, but this is the cleaner
  // semantic guard.
  let crossed: 80 | 100 | null = null;
  if (prevPct < 1 && newPct >= 1) crossed = 100;
  else if (prevPct < 0.8 && newPct >= 0.8) crossed = 80;
  if (!crossed) return;

  void notifyBudgetCrossed({
    budgetId: target._id,
    budgetName: target.name,
    category: target.category,
    spent: newSpent,
    allocated: target.allocated,
    threshold: crossed,
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation<TransactionDoc, ApiError, CreateTransactionInput>({
    mutationFn: (body) =>
      api<TransactionDoc>("/api/transactions", { method: "POST", body }),
    onSuccess: (tx) => {
      invalidateAfterMutation(qc);
      maybeFireBudgetAlert(qc, tx);
      useToast.getState().success("Transaction saved");
    },
    onError: (err) => {
      useToast.getState().error("Couldn't save transaction", err.message);
    },
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
    onSuccess: () => {
      invalidateAfterMutation(qc);
      useToast.getState().success("Transaction updated");
    },
    onError: (err) => {
      useToast.getState().error("Couldn't update transaction", err.message);
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) =>
      api(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateAfterMutation(qc);
      useToast.getState().success("Transaction deleted");
    },
    onError: (err) => {
      useToast.getState().error("Couldn't delete transaction", err.message);
    },
  });
}
