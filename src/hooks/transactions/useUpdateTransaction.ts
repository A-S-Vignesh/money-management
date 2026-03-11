import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";
import { UpdateTransactionInput } from "@/validations/transaction";

interface UpdateTransactionArgs {
  id: string;
  data: UpdateTransactionInput;
}

async function updateTransaction({ id, data }: UpdateTransactionArgs) {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to update transaction");
  }

  return result;
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore.getState();

  return useMutation({
    mutationFn: updateTransaction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      showToast(
        data.message || "Transaction updated successfully",
        data.type || "success",
      );
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
}
