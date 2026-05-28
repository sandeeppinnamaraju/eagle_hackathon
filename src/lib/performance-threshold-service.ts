import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";

const PERFORMANCE_THRESHOLD_PATH = "/api/v1/admin/performance-threshold";
const PERFORMANCE_THRESHOLD_FALLBACK_URL = "/api/v1/admin/performance-threshold";

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

export interface PerformanceThresholdConfig {
  onTrack: number;
  atRiskStart: number;
  atRiskEnd: number;
  offTrack: number;
}

interface PerformanceThresholdConfigApiResponse {
  onTrack?: unknown;
  atRiskStart?: unknown;
  atRiskEnd?: unknown;
  offTrack?: unknown;
}

export interface PerformanceThresholdConfigResult {
  data: PerformanceThresholdConfig;
  source: "api" | "fallback";
  error: Error | null;
}

export interface PerformanceThresholdResult {
  success: boolean;
  message: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toPositiveInt = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1) return Math.round(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1) return Math.round(parsed);
  }
  return fallback;
};

const parseConfigResponse = (
  payload: unknown,
  fallback: PerformanceThresholdConfig,
): PerformanceThresholdConfig => {
  if (!isRecord(payload)) return fallback;
  const mapped = payload as PerformanceThresholdConfigApiResponse;
  return {
    onTrack: toPositiveInt(mapped.onTrack, fallback.onTrack),
    atRiskStart: toPositiveInt(mapped.atRiskStart, fallback.atRiskStart),
    atRiskEnd: toPositiveInt(mapped.atRiskEnd, fallback.atRiskEnd),
    offTrack: toPositiveInt(mapped.offTrack, fallback.offTrack),
  };
};

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
  async getThresholds(
    fallback: PerformanceThresholdConfig,
    signal?: AbortSignal,
  ): Promise<PerformanceThresholdConfigResult> {
    try {
      const response = await fetch(
        withApiBaseUrl(PERFORMANCE_THRESHOLD_PATH, PERFORMANCE_THRESHOLD_FALLBACK_URL),
        withApiRequestConfig({ method: "GET", signal }),
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch configuration: ${response.status}`);
      }

      const payload = (await response.json()) as unknown;
      return {
        data: parseConfigResponse(payload, fallback),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to fetch configuration");
      return {
        data: fallback,
        source: "fallback",
        error: normalizedError,
      };
    }
  },

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
