import { create } from "zustand";
import { IAccount, NewAccount, UpdateAccount } from "@/types/account";
import { useToastStore } from "./useToastStore";

interface AccountStore {
  accounts: IAccount[];
  loading: boolean;
  error: string | null;

  fetchAccounts: () => Promise<void>;
  addAccount: (accountData: NewAccount) => Promise<void>;
  updateAccount: (id: string, updatedData: UpdateAccount) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set) => {
  const { showToast } = useToastStore.getState();

  return {
    accounts: [],
    loading: false,
    error: null,

    fetchAccounts: async () => {
      set({ loading: true, error: null });
      try {
        const res = await fetch(`/api/accounts`);
        const response = await res.json();

        if (!res.ok)
          throw new Error(response.message || "Failed to fetch accounts");

        set({ accounts: response.data, loading: false });
      } catch (err: any) {
        set({ error: err.message, loading: false });
        showToast(err.message, "error");
      }
    },

    addAccount: async (accountData: NewAccount) => {
      set({ error: null });
      try {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountData),
        });
        const response = await res.json();

        if (!res.ok)
          throw new Error(response.message || "Failed to add account");

        set((state) => ({ accounts: [...state.accounts, response.data] }));

        showToast(response.message, response.type || "success");
      } catch (err: any) {
        set({ error: err.message });
        showToast(err.message, "error");
      }
    },

    updateAccount: async (id: string, updatedData: UpdateAccount) => {
      set({ error: null });
      try {
        const res = await fetch(`/api/accounts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
        const response = await res.json();

        if (!res.ok)
          throw new Error(response.message || "Failed to update account");

        set((state) => ({
          accounts: state.accounts.map((acc) =>
            acc._id === id ? response.data : acc
          ),
        }));

        showToast(response.message, response.type || "success");
      } catch (err: any) {
        set({ error: err.message });
        showToast(err.message, "error");
      }
    },

    deleteAccount: async (id: string) => {
      set({ error: null });
      try {
        const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
        const response = await res.json();

        if (!res.ok)
          throw new Error(response.message || "Failed to delete account");

        set((state) => ({
          accounts: state.accounts.filter((acc) => acc._id !== id),
        }));

        showToast(response.message, response.type || "success");
      } catch (err: any) {
        set({ error: err.message });
        showToast(err.message, "error");
      }
    },
  };
});
