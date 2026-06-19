import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";
import { AdjustBalanceInput } from "@/validations/account";

interface AdjustBalanceArgs {
  id: string;
  data: AdjustBalanceInput;
}

// Sets an account's balance to a target value. The backend books an
// `adjustment` transaction for the difference so balance stays derivable —
// see /api/accounts/[id]/adjust.
async function adjustBalance({ id, data }: AdjustBalanceArgs) {
  const res = await fetch(`/api/accounts/${id}/adjust`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to adjust balance");
  }

  return result;
}

export function useAdjustBalance() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore.getState();

  return useMutation({
    mutationFn: adjustBalance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      showToast(
        data.message || "Balance adjusted successfully",
        data.type || "success",
      );
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
}
