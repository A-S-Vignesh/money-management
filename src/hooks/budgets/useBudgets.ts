import { useQuery } from "@tanstack/react-query";
import IBudget from "@/types/budget";

interface BudgetsParams {
  page?: number;
  limit?: number;
  period?: string;
}

interface PaginatedBudgetsResponse {
  message: string;
  type: string;
  success: boolean;
  data: IBudget[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchBudgets(
  params: BudgetsParams,
): Promise<PaginatedBudgetsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.period && params.period !== "All")
    searchParams.set("period", params.period);

  const res = await fetch(`/api/budgets?${searchParams.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch budgets");
  }

  return data;
}

export function useBudgets(params: BudgetsParams = {}) {
  return useQuery({
    queryKey: ["budgets", params],
    queryFn: () => fetchBudgets(params),
  });
}
