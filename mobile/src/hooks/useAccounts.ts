// hooks/useAccounts.ts
// Lightweight wrapper around /api/accounts. The account picker on the
// AddTransaction sheet uses this, so we always fetch with includeGoals=true
// (which lets users move money into a goal-linked account).

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AccountDoc {
  _id: string;
  userId: string;
  name: string;
  type: "bank" | "cash" | "credit" | "investment" | "system" | "goal" | "other";
  balance: number;
  isSystem?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function useAccounts(params: { includeGoals?: boolean } = {}) {
  const { includeGoals = true } = params;
  return useQuery<AccountDoc[]>({
    queryKey: ["accounts", { includeGoals }],
    queryFn: async () => {
      const envelope = await api<{ data: AccountDoc[] }>("/api/accounts", {
        query: { limit: 100, includeGoals: includeGoals ? "true" : undefined },
        envelope: true,
      });
      return envelope.data;
    },
  });
}
