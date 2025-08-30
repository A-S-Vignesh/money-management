import { create } from "zustand";
import { IAccount, NewAccount, UpdateAccount } from "@/types/account";

interface AccountStore {
  accounts: IAccount[];
  loading: boolean;
  error: string | null;

  fetchAccounts: () => Promise<void>;
  addAccount: (accountData: NewAccount) => Promise<void>;
  updateAccount: (id: string, updatedData: UpdateAccount) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/accounts`);
      const data: IAccount[] = await res.json();

      if (!res.ok)
        throw new Error((data as any).error || "Failed to fetch accounts");
      set({ accounts: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
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
      const data: IAccount = await res.json();

      if (!res.ok)
        throw new Error((data as any).error || "Failed to add account");

      set((state) => ({ accounts: [...state.accounts, data] }));
    } catch (err: any) {
      set({ error: err.message });
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
      const data: IAccount = await res.json();

      if (!res.ok)
        throw new Error((data as any).error || "Failed to update account");

      set((state) => ({
        accounts: state.accounts.map((acc) => (acc._id === id ? data : acc)),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteAccount: async (id: string) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");

      set((state) => ({
        accounts: state.accounts.filter((acc) => acc._id !== id),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
