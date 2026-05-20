// hooks/useGoals.ts
// Wraps /api/goals (list + CRUD) and /api/goals/[id] (detail). The list
// endpoint enriches each row with `saved` (the goal's linked account
// balance) so we don't need to follow up with N account requests.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export interface GoalDoc {
  _id: string;
  userId: string;
  accountId: string;
  name: string;
  target: number;
  /** Server-computed: balance of the linked account. */
  saved: number;
  category: string;
  priority: "Low" | "Medium" | "High";
  deadline?: string;
  color: string;
  isCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGoalInput {
  name: string;
  target: number;
  category: string;
  priority?: "Low" | "Medium" | "High";
  deadline: string; // ISO
  color: string;
}

export type UpdateGoalInput = Partial<CreateGoalInput>;

export function useGoals() {
  return useQuery<GoalDoc[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const env = await api<{ data: GoalDoc[] }>("/api/goals", {
        query: { limit: 100 },
        envelope: true,
      });
      return env.data;
    },
  });
}

export function useGoal(id: string | undefined) {
  return useQuery<GoalDoc>({
    queryKey: ["goal", id],
    queryFn: () => api<GoalDoc>(`/api/goals/${id}`),
    enabled: !!id,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────

function invalidate(qc: ReturnType<typeof useQueryClient>, id?: string) {
  qc.invalidateQueries({ queryKey: ["goals"] });
  if (id) qc.invalidateQueries({ queryKey: ["goal", id] });
  qc.invalidateQueries({ queryKey: ["accounts"] });
  qc.invalidateQueries({ queryKey: ["goals-count"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useAddGoal() {
  const qc = useQueryClient();
  return useMutation<GoalDoc, ApiError, CreateGoalInput>({
    mutationFn: (body) => api<GoalDoc>("/api/goals", { method: "POST", body }),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateGoal(id: string) {
  const qc = useQueryClient();
  return useMutation<GoalDoc, ApiError, UpdateGoalInput>({
    mutationFn: (body) =>
      api<GoalDoc>(`/api/goals/${id}`, { method: "PUT", body }),
    onSuccess: () => invalidate(qc, id),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => api(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(qc),
  });
}
