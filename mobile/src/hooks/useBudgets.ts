// hooks/useBudgets.ts
// Wraps GET /api/budgets, which (after the backend update) returns each
// budget enriched with its `spent` total computed in a single $facet
// aggregation. So no client-side joining of transactions is needed.

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
