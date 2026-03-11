import { useQuery } from "@tanstack/react-query";
import { ITransaction } from "@/types/transaction";

interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: "all" | "income" | "expense" | "transfer";
  search?: string;
  account?: string;
  startDate?: string;
  endDate?: string;
}

interface PaginatedTransactionsResponse {
  message: string;
  type: string;
  success: boolean;
  data: ITransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netFlow: number;
  };
}

async function fetchPaginatedTransactions(
  filters: TransactionFilters,
): Promise<PaginatedTransactionsResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  if (filters.account && filters.account !== "all")
    params.set("account", filters.account);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);

  const res = await fetch(`/api/transactions?${params.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch transactions");
  }

  return data;
}

export function useTransactionsPaginated(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchPaginatedTransactions(filters),
  });
}
