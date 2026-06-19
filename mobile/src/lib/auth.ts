// lib/auth.ts
// Auth store: JWT token + user, persisted in expo-secure-store (encrypted on
// device). Web's NextAuth flow is unchanged; mobile uses Bearer tokens
// minted by POST /api/auth/mobile/google.

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { MobileAuthResponse } from "@/_shared";

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

  // State updates land in memory FIRST (sync) so the auth gate sees the
  // new token immediately on the same render — otherwise the SecureStore
  // round-trip leaves a 100ms window where consumers still see `token=null`
  // and bounce back to login. SecureStore writes happen fire-and-forget;
  // if they fail, the user is still signed in for the current session and
  // we'll re-attempt on the next sign-in.
  signIn: async ({ token, user }) => {
    set({ token, user });
    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      ]);
    } catch (e) {
      console.warn("[auth] SecureStore write failed", e);
    }
  },

  signOut: async () => {
    set({ token: null, user: null });
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
      ]);
    } catch (e) {
      console.warn("[auth] SecureStore delete failed", e);
    }
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
