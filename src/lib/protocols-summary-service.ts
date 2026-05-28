import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type {
  ProtocolsSummaryApiResponse,
  ProtocolsSummaryData,
  ProtocolsSummaryResult,
} from "@/lib/protocols-summary-types";

const PROTOCOLS_SUMMARY_PATH = "/api/v1/protocols/summary";
const PROTOCOLS_SUMMARY_FALLBACK_URL = "/api/v1/protocols/summary";

const toNonNegativeNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return fallback;
};

const getFallbackData = (): ProtocolsSummaryData => ({
  protocolCount: 36,
  distinctTherapeuticAreaCount: 6,
});

const mapPayload = (payload: ProtocolsSummaryApiResponse): ProtocolsSummaryData => {
  const fallback = getFallbackData();

  return {
    protocolCount: toNonNegativeNumber(payload.protocolCount, fallback.protocolCount),
    distinctTherapeuticAreaCount: toNonNegativeNumber(
      payload.distinctTherapeuticAreaCount,
      fallback.distinctTherapeuticAreaCount,
    ),
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

async function fetchProtocolsSummary(signal?: AbortSignal): Promise<ProtocolsSummaryApiResponse> {
  const response = await fetch(
    withApiBaseUrl(PROTOCOLS_SUMMARY_PATH, PROTOCOLS_SUMMARY_FALLBACK_URL),
    withApiRequestConfig({ method: "GET", signal }),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch protocols summary: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected protocols summary API response shape");
  }

  return payload as ProtocolsSummaryApiResponse;
}

export const protocolsSummaryService = {
  async getProtocolsSummary(signal?: AbortSignal): Promise<ProtocolsSummaryResult> {
    try {
      const payload = await fetchProtocolsSummary(signal);
      return {
        data: mapPayload(payload),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load protocols summary");

      return {
        data: getFallbackData(),
        source: "mock",
        error: normalizedError,
      };
    }
  },
};
