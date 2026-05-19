// lib/api.ts
// Thin fetch wrapper that attaches the Bearer token from the auth store
// and unwraps the web app's `{ success, data, message, errors }` envelope.

import Constants from "expo-constants";
import { useAuth } from "./auth";

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "https://money-nest.vercel.app";

// Surface the base URL once on module load so it's obvious in Metro which
// backend the app is talking to. Crucial when chasing "I signed in but the
// dashboard signed me out" bugs — the JWT-minting backend (the OAuth relay)
// and the JWT-verifying backend (this base URL) MUST share NEXTAUTH_SECRET.
console.log(`[api] base URL = ${API_BASE_URL}`);

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string[]>;
  constructor(message: string, status: number, fields?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Options {
  method?: Method;
  body?: unknown;
  // Append search params (skips undefined/null entries automatically).
  query?: Record<string, string | number | boolean | undefined | null>;
  // For routes that don't return the envelope (e.g. raw blob exports).
  raw?: boolean;
  // Override the auto-Bearer behaviour — pass `false` for public endpoints.
  withAuth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Options["query"]): string {
  const url = new URL(path, API_BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function api<T = unknown>(
  path: string,
  opts: Options = {},
): Promise<T> {
  const { method = "GET", body, query, raw, withAuth = true, signal } = opts;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (withAuth) {
    const token = useAuth.getState().token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const fullUrl = buildUrl(path, query);
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });
  console.log(`[api] ${method} ${path} → ${res.status}`);

  // 401 → token expired or invalid; clear and let the auth gate re-route.
  if (res.status === 401 && withAuth) {
    console.warn(
      `[api] 401 from ${fullUrl} — signing out.\n` +
        `If you just signed in, the backend at this URL is NOT the same backend that minted the JWT.\n` +
        `Check that EXPO_PUBLIC_API_BASE_URL and EXPO_PUBLIC_AUTH_BASE_URL share NEXTAUTH_SECRET, ` +
        `or set them both to the same Vercel deployment.`,
    );
    await useAuth.getState().signOut();
    throw new ApiError("Session expired", 401);
  }

  if (raw) {
    if (!res.ok) throw new ApiError(`Request failed (${res.status})`, res.status);
    return res as unknown as T;
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`Bad response from server (${res.status})`, res.status);
  }

  const envelope = json as {
    success?: boolean;
    type?: string;
    message?: string;
    data?: unknown;
    errors?: Record<string, string[]>;
  };

  if (!res.ok || envelope.success === false || envelope.type === "error") {
    throw new ApiError(
      envelope.message || `Request failed (${res.status})`,
      res.status,
      envelope.errors,
    );
  }

  // Some routes return data at the top level (dashboard, reports), others
  // nest it under `.data`. Prefer `.data` when present.
  return (envelope.data !== undefined ? envelope.data : envelope) as T;
}
