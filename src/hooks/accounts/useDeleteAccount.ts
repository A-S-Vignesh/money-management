import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/useToastStore";

async function deleteAccount(id: string) {
  const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to delete account");
  }

  return data;
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore.getState();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      showToast(
        data.message || "Account deleted successfully",
        data.type || "success",
      );
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });
}
