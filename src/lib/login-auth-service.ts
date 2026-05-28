import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type { SessionUser } from "@/lib/auth";

export interface LoginApiRequest {
  username: string;
  password: string;
  studyId: string;
}

export interface LoginApiResponse {
  success?: unknown;
  message?: unknown;
  username?: unknown;
  role?: unknown;
}

export interface LoginApiResult {
  success: boolean;
  message: string;
  username: string | null;
  role: SessionUser["role"] | null;
}

export const INVALID_LOGIN_ERROR = "Invalid username or password.";

export const normalizeLoginUsername = (username: string): string =>
  username.trim().toLowerCase();

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toBooleanOrNull = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
};

const normalizeRole = (value: unknown): SessionUser["role"] | null => {
  const normalized = toStringOrNull(value)?.toUpperCase();
  if (!normalized) return null;
  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "VIEWER" || normalized === "USER") return "VIEWER";
  if (normalized === "CONTRIBUTOR") return "CONTRIBUTOR";
  return null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export async function authenticateLoginApi({
  username,
  password,
  studyId,
}: LoginApiRequest): Promise<LoginApiResult> {
  const params = new URLSearchParams({ studyId });
  const path = `/api/v1/auth/login?${params.toString()}`;
  const response = await fetch(
    withApiBaseUrl(path, path),
    withApiRequestConfig({
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  );

  if (!response.ok) {
    throw new Error(`Login request failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected login API response shape");
  }

  const mapped = payload as LoginApiResponse;
  const success = toBooleanOrNull(mapped.success) ?? false;

  return {
    success,
    message: toStringOrNull(mapped.message) ?? (success ? "Authentication successful" : INVALID_LOGIN_ERROR),
    username: toStringOrNull(mapped.username),
    role: normalizeRole(mapped.role),
  };
}
