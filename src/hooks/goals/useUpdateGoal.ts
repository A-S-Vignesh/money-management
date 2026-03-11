import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";
import { UpdateGoalInput } from "@/validations/goal";

interface UpdateGoalArgs {
  id: string;
  data: UpdateGoalInput;
}

async function updateGoal({ id, data }: UpdateGoalArgs) {
  const res = await fetch(`/api/goals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to update goal");
  }

  return result;
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore.getState();

  return useMutation({
    mutationFn: updateGoal,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      showToast(
        data.message || "Goal updated successfully",
        data.type || "success",
      );
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
}
