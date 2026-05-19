// Common API response envelope used by every Next.js route in the web app.
// Mobile API client unwraps this — see mobile/lib/api.ts.

export interface ApiSuccess<T> {
  success: true;
  type: "success";
  message?: string;
  data: T;
}

export interface ApiError {
  success?: false;
  type: "error" | "warning";
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiSuccess<T[]> {
  pagination: Pagination;
}

// ── Mobile auth ─────────────────────────────────────────────────────────
// POST /api/auth/mobile/google
export interface MobileAuthRequest {
  idToken: string; // Google ID token from native Google Sign-In SDK
}

export interface MobileAuthResponse {
  token: string; // app JWT (Bearer)
  user: {
    _id: string;
    email: string;
    name?: string;
    image?: string;
  };
}
