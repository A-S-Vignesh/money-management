import { useQuery } from "@tanstack/react-query";
import { ITransaction } from "@/types/transaction";

interface TransactionsResponse {
  message: string;
  type: string;
  success: boolean;
  data: ITransaction[];
}

async function fetchTransactions(): Promise<TransactionsResponse> {
  const res = await fetch("/api/transactions");
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch transactions");
  }

  return data;
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });
}
