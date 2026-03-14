import { useQuery } from "@tanstack/react-query";

interface UseNotificationsParams {
  page?: number;
  limit?: number;
  type?: string;
  read?: string;
}

export function useNotifications(params: UseNotificationsParams = {}) {
  const { page = 1, limit = 10, type, read } = params;

  return useQuery({
    queryKey: ["notifications", { page, limit, type, read }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("page", String(page));
      searchParams.set("limit", String(limit));
      if (type && type !== "all") searchParams.set("type", type);
      if (read) searchParams.set("read", read);

      const res = await fetch(`/api/notifications?${searchParams}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30s for real-time badge and synced list
  });
}
