import { create } from "zustand";
import { useToastStore } from "./useToastStore";
import IBudget from "@/types/budget";

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

    // Fetch all budgets
    fetchBudgets: async () => {
      set({ loading: true, error: null });
      try {
        const res = await fetch("/api/budgets");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch budgets");

        set({ budgets: data.data || [], loading: false });
        // ❌ No success toast for fetch (as per your preference)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message, loading: false });
        showToast(message, "error");
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

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add budget");

        set((state) => ({
          budgets: [...state.budgets, data.data],
        }));

        showToast(data.message || "Budget added successfully!", "success");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message, loading: false });
        showToast(message, "error");
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

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update budget");

        set((state) => ({
          budgets: state.budgets.map((b) => (b._id === id ? data.data : b)),
        }));

        showToast(data.message || "Budget updated successfully!", "success");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message, loading: false });
        showToast(message, "error");
      }
    },

    deleteBudget: async (id) => {
      set({ error: null });
      try {
        const res = await fetch(`/api/budgets/${id}`, {
          method: "DELETE",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete budget");

        set((state) => ({
          budgets: state.budgets.filter((b) => b._id !== id),
        }));

        showToast(data.message || "Budget deleted successfully!", "success");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        set({ error: message, loading: false });
        showToast(message, "error");
      }
    },
  };
});
