// lib/queryClient.ts
// One TanStack Query client for the whole app. Same defaults as the web's
// src/app/Providers.tsx (5min staleTime). gcTime bumped to 24h so the
// AsyncStorage persister has a wide enough window to restore cached data
// on cold-start — without this the GC would purge entries before the
// persister finishes hydrating, defeating offline-first.

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000, // 24h — required for persist
      retry: 2,
      refetchOnWindowFocus: false, // native equivalent is refetchOnMount/AppState
    },
  },
});
