import { useQuery } from "@tanstack/react-query";
import IProfile from "@/types/profile";

async function fetchProfile(): Promise<IProfile> {
  const res = await fetch("/api/profile");
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "Failed to fetch profile");
  }

  return json.data;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes — profile rarely changes
  });
}
