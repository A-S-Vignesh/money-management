import { useQuery } from "@tanstack/react-query";

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=1&read=false");
      if (!res.ok) throw new Error("Failed to fetch unread count");
      const data = await res.json();
      return data.unreadCount as number;
    },
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Poll every 30s for real-time badge
  });
}
