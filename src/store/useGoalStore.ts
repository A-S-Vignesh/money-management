// stores/goalStore.ts
import { create } from "zustand";
import IGoal from "@/types/goal";
import { useAccountStore } from "./useAccountStore";

interface GoalState {
  goals: IGoal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  addGoal: (goalData: IGoal) => Promise<void>;
  updateGoal: (id: string, goalData: IGoal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  // ✅ Fetch all goals
  fetchGoals: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/goals");
      const data: IGoal[] | { error: string } = await res.json();
      if (res.ok) {
        set({ goals: data as IGoal[], loading: false });
      } else {
        set({ error: (data as { error: string }).error, loading: false });
      }
    } catch {
      set({ error: "Failed to fetch goals", loading: false });
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
      const data: IGoal | { error: string } = await res.json();
      if (res.ok) {
        set({ goals: [data as IGoal, ...get().goals] });
        const { fetchAccounts } = useAccountStore.getState();
        await fetchAccounts();
      } else {
        set({ error: (data as { error: string }).error });
      }
    } catch {
      set({ error: "Failed to add goal" });
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
      const data: IGoal | { error: string } = await res.json();
      if (res.ok) {
        set({
          goals: get().goals.map((goal) =>
            goal._id === id ? (data as IGoal) : goal
          ),
        });
      } else {
        set({ error: (data as { error: string }).error });
      }
    } catch {
      set({ error: "Failed to update goal" });
    }
  },

  // ✅ Delete goal by ID
  deleteGoal: async (id) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        set({ goals: get().goals.filter((goal) => goal._id !== id) });
      } else {
        const data: { error: string } = await res.json();
        set({ error: data.error });
      }
    } catch {
      set({ error: "Failed to delete goal" });
    }
  },
}));
