// hooks/useAccounts.ts
// Reads /api/accounts and provides create/update/delete mutations for the
// Accounts page. Mutations invalidate the dashboard so the total-balance
// hero stays in sync.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export interface AccountDoc {
  _id: string;
  userId: string;
  name: string;
  type: "bank" | "cash" | "credit" | "investment" | "system" | "goal" | "other";
  balance: number;
  /** Hex card color picked in the AccountSheet. Optional — UI falls back
   *  to a deterministic color when missing. */
  color?: string;
  isSystem?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountDoc["type"];
  balance: number;
  color?: string;
}

// Update doesn't accept balance — balance is derived from transactions and
// can't be edited directly. Mirrors the backend schema.
export interface UpdateAccountInput {
  name?: string;
  type?: AccountDoc["type"];
  color?: string;
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

// ── Mutations ────────────────────────────────────────────────────────────

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["accounts"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["transactions"] });
}

export function useAddAccount() {
  const qc = useQueryClient();
  return useMutation<AccountDoc, ApiError, CreateAccountInput>({
    mutationFn: (body) =>
      api<AccountDoc>("/api/accounts", { method: "POST", body }),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateAccount(id: string) {
  const qc = useQueryClient();
  return useMutation<AccountDoc, ApiError, UpdateAccountInput>({
    mutationFn: (body) =>
      api<AccountDoc>(`/api/accounts/${id}`, { method: "PUT", body }),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => api(`/api/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(qc),
  });
}

// Set an account's balance to a target value. The backend books an
// `adjustment` transaction for the difference (target − current) so the
// balance stays derivable — see /api/accounts/[id]/adjust.
export function useAdjustBalance(id: string) {
  const qc = useQueryClient();
  return useMutation<AccountDoc, ApiError, { balance: number; note?: string }>({
    mutationFn: (body) =>
      api<AccountDoc>(`/api/accounts/${id}/adjust`, { method: "POST", body }),
    onSuccess: () => invalidate(qc),
  });
}
