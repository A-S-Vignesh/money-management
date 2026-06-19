// hooks/useNotifications.ts
// Wraps /api/notifications + /api/notifications/[id] + the bulk-action
// endpoints (mark-all-read, clear-read).
//
// The screen also reads `unreadCount` from the list response — used by
// the bell-badge dot on Profile / Dashboard.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export type NotificationType = "budget" | "goal" | "transaction" | "system";

export interface NotificationDoc {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface NotificationsResponse {
  data: NotificationDoc[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function useNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: () =>
      api<NotificationsResponse>("/api/notifications", {
        query: { limit: 50 },
        envelope: true,
      }),
    // Keep the bell badge fresh-ish without hammering the server.
    refetchInterval: 60_000,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["notifications"] });
}

// PATCH /api/notifications/:id with { isRead: true }
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) =>
      api(`/api/notifications/${id}`, {
        method: "PATCH",
        body: { isRead: true },
      }),
    onSuccess: () => invalidate(qc),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, void>({
    mutationFn: () =>
      api("/api/notifications/mark-all-read", { method: "PATCH" }),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => api(`/api/notifications/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(qc),
  });
}

export function useClearReadNotifications() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, void>({
    mutationFn: () =>
      api("/api/notifications/clear-read", { method: "DELETE" }),
    onSuccess: () => invalidate(qc),
  });
}
