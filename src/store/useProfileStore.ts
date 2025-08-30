import { create } from "zustand";
import IProfile from "@/types/profile"

interface ProfileState {
  profile: IProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (updatedProfile: IProfile) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: false,
  error: null,

  // Fetch profile from backend
  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");

      const data: IProfile = await res.json();
      set({ profile: data, loading: false });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      set({ error: message, loading: false });
    }
  },

  // Update profile and sync with backend
  updateProfile: async (updatedProfile) => {
    set({ error: null });
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updated: IProfile = await res.json();
      set({ profile: updated });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      set({ error: message });
    }
  },
}));
