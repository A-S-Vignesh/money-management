import { useQuery } from "@tanstack/react-query";
import IGoal from "@/types/goal";

interface GoalsParams {
  page?: number;
  limit?: number;
  priority?: string;
}

interface PaginatedGoalsResponse {
  message: string;
  type: string;
  success: boolean;
  data: IGoal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchGoals(
  params: GoalsParams,
): Promise<PaginatedGoalsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.priority && params.priority !== "all")
    searchParams.set("priority", params.priority);

  const res = await fetch(`/api/goals?${searchParams.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch goals");
  }

  return data;
}

export function useGoals(params: GoalsParams = {}) {
  return useQuery({
    queryKey: ["goals", params],
    queryFn: () => fetchGoals(params),
  });
}
