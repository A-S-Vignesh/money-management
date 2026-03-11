import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";
import { CreateBudgetInput } from "@/validations/budget";

async function addBudget(data: CreateBudgetInput) {
  const res = await fetch("/api/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to add budget");
  }

  return result;
}

export function useAddBudget() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore.getState();

  return useMutation({
    mutationFn: addBudget,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      showToast(
        data.message || "Budget created successfully",
        data.type || "success",
      );
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
}
