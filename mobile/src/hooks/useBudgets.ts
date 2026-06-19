// hooks/useBudgets.ts
// Wraps GET /api/budgets, which (after the backend update) returns each
// budget enriched with its `spent` total computed in a single $facet
// aggregation. So no client-side joining of transactions is needed.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";

export interface BudgetDoc {
  _id: string;
  userId: string;
  name: string;
  category: string;
  allocated: number;
  /** Server-computed: sum of expense transactions in this budget's category
   *  within [startDate, endDate]. May be 0 if no spending yet. */
  spent: number;
  period: "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBudgetInput {
  name: string;
  category: string;
  allocated: number;
  period: "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  startDate: string; // ISO
  endDate: string; // ISO
}

export type UpdateBudgetInput = Partial<CreateBudgetInput>;

export function useBudgets(period: string = "All") {
  return useQuery<BudgetDoc[]>({
    queryKey: ["budgets", { period }],
    queryFn: async () => {
      const envelope = await api<{ data: BudgetDoc[] }>("/api/budgets", {
        query: { limit: 100, period: period === "All" ? undefined : period },
        envelope: true,
      });
      return envelope.data;
    },
  });
}

// ── Mutations ────────────────────────────────────────────────────────────

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["budgets"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] }); // dashboard shows active budget count
}

export function useAddBudget() {
  const qc = useQueryClient();
  return useMutation<BudgetDoc, ApiError, CreateBudgetInput>({
    mutationFn: (body) =>
      api<BudgetDoc>("/api/budgets", { method: "POST", body }),
    onSuccess: () => {
      invalidate(qc);
      useToast.getState().success("Budget created");
    },
    onError: (err) => useToast.getState().error("Couldn't create budget", err.message),
  });
}

export function useUpdateBudget(id: string) {
  const qc = useQueryClient();
  return useMutation<BudgetDoc, ApiError, UpdateBudgetInput>({
    mutationFn: (body) =>
      api<BudgetDoc>(`/api/budgets/${id}`, { method: "PUT", body }),
    onSuccess: () => {
      invalidate(qc);
      useToast.getState().success("Budget updated");
    },
    onError: (err) => useToast.getState().error("Couldn't update budget", err.message),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => api(`/api/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate(qc);
      useToast.getState().success("Budget deleted");
    },
    onError: (err) => useToast.getState().error("Couldn't delete budget", err.message),
  });
}
