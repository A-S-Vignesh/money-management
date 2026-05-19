// lib/queryClient.ts
// One TanStack Query client for the whole app. Same defaults as the web's
// src/app/Providers.tsx (5min staleTime, 10min gcTime).

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false, // native equivalent is refetchOnMount/AppState
    },
  },
});
