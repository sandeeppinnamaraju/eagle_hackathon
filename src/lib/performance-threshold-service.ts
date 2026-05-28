import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";

const PERFORMANCE_THRESHOLD_PATH = "/api/admin/performance-threshold";
const PERFORMANCE_THRESHOLD_FALLBACK_URL = "/api/admin/performance-threshold";

export interface PerformanceThresholdRequest {
  onTrack: number;
  atRiskStart: number;
  atRiskEnd: number;
  offTrack: number;
}

interface PerformanceThresholdApiResponse {
  success?: unknown;
  message?: unknown;
}

export interface PerformanceThresholdResult {
  success: boolean;
  message: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

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

const parseResponse = (payload: unknown): PerformanceThresholdResult => {
  if (!isRecord(payload)) {
    return {
      success: true,
      message: "Configuration saved",
    };
  }

  const mapped = payload as PerformanceThresholdApiResponse;
  const success = toBooleanOrNull(mapped.success) ?? true;

  return {
    success,
    message:
      toStringOrNull(mapped.message) ?? (success ? "Configuration saved" : "Could not save configuration"),
  };
};

export const performanceThresholdService = {
  async saveThresholds(payload: PerformanceThresholdRequest): Promise<PerformanceThresholdResult> {
    const response = await fetch(
      withApiBaseUrl(PERFORMANCE_THRESHOLD_PATH, PERFORMANCE_THRESHOLD_FALLBACK_URL),
      withApiRequestConfig({
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    );

    let responsePayload: unknown = null;
    try {
      responsePayload = (await response.json()) as unknown;
    } catch {
      responsePayload = null;
    }

    const parsed = parseResponse(responsePayload);

    if (!response.ok) {
      throw new Error(parsed.message || `Failed to save configuration: ${response.status}`);
    }

    return parsed;
  },
};
