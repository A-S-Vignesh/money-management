// store/useTransactionStore.ts
import { create } from "zustand";
import { useAccountStore } from "./useAccountStore";
import { useToastStore } from "./useToastStore";
import { ITransaction } from "@/types/transaction";

interface TransactionStore {
  transactions: ITransaction[];
  loading: boolean;
  error: string | null;

  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<ITransaction, "_id">) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  updateTransaction: (
    id: string,
    updatedTransaction: Partial<ITransaction>
  ) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => {
  const { showToast } = useToastStore.getState();

  return {
    transactions: [],
    loading: false,
    error: null,

    // ✅ Fetch transactions
    fetchTransactions: async () => {
      set({ loading: true, error: null });
      try {
        const res = await fetch("/api/transactions");
        const result = await res.json();

        if (!res.ok)
          throw new Error(result.message || "Failed to fetch transactions");

        set({ transactions: result.data as ITransaction[], loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
        showToast(error.message, "error");
      }
    },

    // ✅ Add transaction
    addTransaction: async (transaction) => {
      set({ error: null });
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaction),
        });

        const result = await res.json();
        if (!res.ok)
          throw new Error(result.message || "Failed to add transaction");

        set((state) => ({
          transactions: [...state.transactions, result.data as ITransaction],
        }));

        // Refresh accounts
        const { fetchAccounts } = useAccountStore.getState();
        fetchAccounts();

        showToast(result.message, result.type);
      } catch (error: any) {
        set({ error: error.message });
        showToast(error.message, "error");
      }
    },

    // ✅ Remove transaction
    removeTransaction: async (id) => {
      set({ error: null });
      try {
        const res = await fetch(`/api/transactions/${id}`, {
          method: "DELETE",
        });
        const result = await res.json();

        if (!res.ok)
          throw new Error(result.message || "Failed to delete transaction");

        set((state) => ({
          transactions: state.transactions.filter((t) => t._id !== id),
        }));

        const { fetchAccounts } = useAccountStore.getState();
        fetchAccounts();

        showToast(result.message, result.type);
      } catch (error: any) {
        set({ error: error.message });
        showToast(error.message, "error");
      }
    },

    // ✅ Update transaction
    updateTransaction: async (id, updatedTransaction) => {
      set({ error: null });
      try {
        const res = await fetch(`/api/transactions/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTransaction),
        });

        const result = await res.json();
        if (!res.ok)
          throw new Error(result.message || "Failed to update transaction");

        set((state) => ({
          transactions: state.transactions.map((t) =>
            t._id === id ? (result.data as ITransaction) : t
          ),
        }));

        const { fetchAccounts } = useAccountStore.getState();
        fetchAccounts();

        showToast(result.message, result.type);
      } catch (error: any) {
        set({ error: error.message });
        showToast(error.message, "error");
      }
    },
  };
});
