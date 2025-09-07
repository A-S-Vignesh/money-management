// stores/goalStore.ts
import { create } from "zustand";
import IGoal from "@/types/goal";
import { useAccountStore } from "./useAccountStore";
import { useToastStore } from "./useToastStore";

interface GoalState {
  goals: IGoal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  addGoal: (goalData: Partial<IGoal>) => Promise<void>;
  updateGoal: (id: string, goalData: Partial<IGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => {
  const { showToast } = useToastStore.getState();

  return {
    goals: [],
    loading: false,
    error: null,

    // ✅ Fetch all goals
    fetchGoals: async () => {
      set({ loading: true, error: null });
      try {
        const res = await fetch("/api/goals");
        const result = await res.json();

        if (res.ok) {
          set({ goals: result.data, loading: false });
        } else {
          set({ error: result.message, loading: false });
          showToast(result.message, result.type || "error");
        }
      } catch {
        set({ error: "Failed to fetch goals", loading: false });
        showToast("Failed to fetch goals", "error");
      }
    },

    // ✅ Add new goal
    addGoal: async (goalData) => {
      try {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalData),
        });
        const result = await res.json();

        if (res.ok) {
          set({ goals: [result.data, ...get().goals] });
          showToast(result.message, result.type);

          // Refresh accounts after creating goal
          const { fetchAccounts } = useAccountStore.getState();
          await fetchAccounts();
        } else {
          set({ error: result.message });
          showToast(result.message, result.type || "error");
        }
      } catch {
        set({ error: "Failed to add goal" });
        showToast("Failed to add goal", "error");
      }
    },

    // ✅ Update goal by ID
    updateGoal: async (id, goalData) => {
      try {
        const res = await fetch(`/api/goals/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalData),
        });
        const result = await res.json();

        if (res.ok) {
          set({
            goals: get().goals.map((goal) =>
              goal._id === id ? result.data : goal
            ),
          });
          showToast(result.message, result.type);
        } else {
          set({ error: result.message });
          showToast(result.message, result.type || "error");
        }
      } catch {
        set({ error: "Failed to update goal" });
        showToast("Failed to update goal", "error");
      }
    },

    // ✅ Delete goal by ID
    deleteGoal: async (id) => {
      try {
        const res = await fetch(`/api/goals/${id}`, {
          method: "DELETE",
        });
        const result = await res.json();

        if (res.ok) {
          set({ goals: get().goals.filter((goal) => goal._id !== id) });
          const { fetchAccounts } = useAccountStore.getState();
          await fetchAccounts();

          showToast(result.message, result.type);
        } else {
          set({ error: result.message });
          showToast(result.message, result.type || "error");
        }
      } catch {
        set({ error: "Failed to delete goal" });
        showToast("Failed to delete goal", "error");
      }
    },
  };
});
