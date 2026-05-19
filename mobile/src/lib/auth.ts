// lib/auth.ts
// Auth store: JWT token + user, persisted in expo-secure-store (encrypted on
// device). Web's NextAuth flow is unchanged; mobile uses Bearer tokens
// minted by POST /api/auth/mobile/google.

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { MobileAuthResponse } from "@money-nest/shared";

const TOKEN_KEY = "money_nest_jwt";
const USER_KEY = "money_nest_user";

interface User {
  _id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  signIn: (payload: MobileAuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  signIn: async ({ token, user }) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  signOut: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null });
  },

  hydrate: async () => {
    try {
      const [token, userRaw] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      const user = userRaw ? (JSON.parse(userRaw) as User) : null;
      set({ token, user, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
