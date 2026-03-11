import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";

async function deleteBudget(id: string) {
  const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to delete budget");
  }

  return data;
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore.getState();

  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      showToast(
        data.message || "Budget deleted successfully",
        data.type || "success",
      );
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
}
