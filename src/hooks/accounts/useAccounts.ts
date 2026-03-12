import { useQuery } from "@tanstack/react-query";
import { IAccount } from "@/types/account";

interface AccountsResponse {
  message: string;
  type: string;
  success: boolean;
  data: IAccount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseAccountsOptions {
  page?: number;
  limit?: number;
  includeGoals?: boolean;
}

async function fetchAccounts({
  page = 1,
  limit = 10,
  includeGoals = false,
}: UseAccountsOptions): Promise<AccountsResponse> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    includeGoals: includeGoals.toString(),
  });
  const res = await fetch(`/api/accounts?${queryParams.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch accounts");
  }

  return data;
}

export function useAccounts({
  page = 1,
  limit = 10,
  includeGoals = false,
}: UseAccountsOptions = {}) {
  return useQuery({
    queryKey: ["accounts", { page, limit, includeGoals }],
    queryFn: () => fetchAccounts({ page, limit, includeGoals }),
  });
}
