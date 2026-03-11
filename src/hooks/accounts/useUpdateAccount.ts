import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";
import { UpdateAccountInput } from "@/validations/account";

interface UpdateAccountArgs {
  id: string;
  data: UpdateAccountInput;
}

async function updateAccount({ id, data }: UpdateAccountArgs) {
  const res = await fetch(`/api/accounts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to update account");
  }

  return result;
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore.getState();

  return useMutation({
    mutationFn: updateAccount,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      showToast(
        data.message || "Account updated successfully",
        data.type || "success",
      );
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
}
