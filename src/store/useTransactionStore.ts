// store/useTransactionStore.ts
import { create } from "zustand";
import { IAccount } from "@/models/Account";
import { useAccountStore } from "./useAccountStore";
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

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  loading: false,
  error: null,

  // ✅ Fetch transactions from backend API
  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/transactions");
      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data: ITransaction[] = await response.json();
      set({ transactions: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // ✅ Add a transaction and sync with backend
  addTransaction: async (transaction: Omit<ITransaction, "_id">) => {
    set({ error: null });
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) throw new Error("Failed to add transaction");

      const savedTransaction: ITransaction = await response.json();

      set((state) => ({
        transactions: [...state.transactions, savedTransaction],
      }));

      // Refresh accounts after adding
      const { fetchAccounts } = useAccountStore.getState();
      fetchAccounts();
    } catch (error: any) {
      console.error("Add transaction error:", error);
      set({ error: error.message });
    }
  },

  // ✅ Remove a transaction and sync with backend
  removeTransaction: async (id: string) => {
    set({ error: null });
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete transaction");

      set((state) => ({
        transactions: state.transactions.filter((t) => t._id !== id),
      }));

      // Refresh accounts after deletion
      const { fetchAccounts } = useAccountStore.getState();
      fetchAccounts();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // ✅ Update a transaction and sync with backend
  updateTransaction: async (
    id: string,
    updatedTransaction: Partial<ITransaction>
  ) => {
    set({ error: null });
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTransaction),
      });
      if (!response.ok) throw new Error("Failed to update transaction");

      const updated: ITransaction = await response.json();

      set((state) => ({
        transactions: state.transactions.map((t) =>
          t._id === id ? updated : t
        ),
      }));

      // Refresh accounts after update
      const { fetchAccounts } = useAccountStore.getState();
      fetchAccounts();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
