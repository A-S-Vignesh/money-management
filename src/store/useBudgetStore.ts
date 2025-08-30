import { create } from "zustand";
import { useToastStore } from "./useToastStore";
import  IBudget  from "@/types/budget";

// Define store interface
interface BudgetStore {
  budgets: IBudget[];
  loading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  addBudget: (budgetData: IBudget) => Promise<void>;
  updateBudget: (id: string, updatedBudget: Partial<IBudget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetStore>((set) => {
  const { showToast } = useToastStore.getState();

  return {
    budgets: [],
    loading: false,
    error: null,

    // Fetch all active budgets
    fetchBudgets: async () => {
      set({ loading: true, error: null });
      try {
        const res = await fetch("/api/budgets");
        if (!res.ok) throw new Error("Failed to fetch budgets");
        const data: IBudget[] = await res.json();
        set({ budgets: data, loading: false });
      } catch (error: unknown) {
        set({
          error: error instanceof Error ? error.message : String(error),
          loading: false,
        });
      }
    },

    addBudget: async (budget) => {
      set({ error: null });
      try {
        const res = await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(budget),
        });

        const message = await res.text();
        if (!res.ok) throw new Error(message);

        const newBudget: IBudget = JSON.parse(message);
        set((state) => ({
          budgets: [...state.budgets, newBudget],
        }));

        showToast("Budget added successfully!", "success");
      } catch (error: unknown) {
        set({
          error: error instanceof Error ? error.message : String(error),
          loading: false,
        });
      }
    },

    updateBudget: async (id, updatedBudget) => {
      set({ error: null });
      try {
        const res = await fetch(`/api/budgets/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedBudget),
        });

        if (!res.ok) throw new Error("Failed to update budget");

        const updated: IBudget = await res.json();
        set((state) => ({
          budgets: state.budgets.map((b) => (b._id === id ? updated : b)),
        }));

        showToast("Budget updated successfully!", "success");
      } catch (error: unknown) {
        set({
          error: error instanceof Error ? error.message : String(error),
          loading: false,
        });
      }
    },

    deleteBudget: async (id) => {
      set({ error: null });
      try {
        const res = await fetch(`/api/budgets/${id}`, {
          method: "DELETE",
        });

        const message = await res.text();
        if (!res.ok) throw new Error(message);

        set((state) => ({
          budgets: state.budgets.filter((b) => b._id !== id),
        }));

        showToast(message, "success");
      } catch (error: unknown) {
        set({
          error: error instanceof Error ? error.message : String(error),
          loading: false,
        });
      }
    },
  };
});
