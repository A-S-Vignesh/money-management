import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";
import { UpdateBudgetInput } from "@/validations/budget";

interface UpdateBudgetArgs {
  id: string;
  data: UpdateBudgetInput;
}

async function updateBudget({ id, data }: UpdateBudgetArgs) {
  const res = await fetch(`/api/budgets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to update budget");
  }

  return result;
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore.getState();

  return useMutation({
    mutationFn: updateBudget,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      showToast(
        data.message || "Budget updated successfully",
        data.type || "success",
      );
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
}
