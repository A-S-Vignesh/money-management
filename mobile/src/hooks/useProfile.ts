// hooks/useProfile.ts
// Wraps GET /api/profile and PUT /api/profile. Profile fields that the
// backend allows updating: name, phoneNo, dob, currency, lang,
// notifications, twoFactorAuth. Email is intentionally NOT editable —
// it's tied to the Google OAuth identity.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export interface ProfileDoc {
  _id: string;
  name: string;
  email: string;
  image?: string;
  phoneNo?: string;
  dob?: string;
  currency?: string;
  lang?: string;
  notifications?: boolean;
  twoFactorAuth?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileInput {
  name?: string;
  phoneNo?: string;
  dob?: string;
  currency?: string;
  lang?: string;
  notifications?: boolean;
  twoFactorAuth?: boolean;
}

export function useProfile() {
  return useQuery<ProfileDoc>({
    queryKey: ["profile"],
    queryFn: () => api<ProfileDoc>("/api/profile"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<ProfileDoc, ApiError, UpdateProfileInput>({
    mutationFn: (body) =>
      api<ProfileDoc>("/api/profile", { method: "PUT", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
