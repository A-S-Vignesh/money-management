import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";
import { CreateGoalInput } from "@/validations/goal";

async function addGoal(data: CreateGoalInput) {
  const res = await fetch("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to create goal");
  }

  return result;
}

export function useAddGoal() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore.getState();

  return useMutation({
    mutationFn: addGoal,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      showToast(
        data.message || "Goal created successfully",
        data.type || "success",
      );
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
}
