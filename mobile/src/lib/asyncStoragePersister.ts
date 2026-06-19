// lib/asyncStoragePersister.ts
// Persist the React Query cache to AsyncStorage so the app can show
// cached data when offline. Throttled to 1 write/sec to avoid
// hammering AsyncStorage on rapid-fire invalidations.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const CACHE_KEY = "@money-nest/query-cache";

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_KEY,
  // Don't flush to disk on every single mutation — batch writes.
  throttleTime: 1000,
});
