import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";

const STUDY_OVERVIEW_INSIGHTS_PATH = "/api/study-overview/insights";
const STUDY_OVERVIEW_INSIGHTS_FALLBACK_URL = "/api/study-overview/insights";

export type InsightTone = "danger" | "warning" | "success" | "info";

export interface StudyOverviewInsight {
  type: InsightTone;
  text: string;
}

interface StudyOverviewInsightsApiResponse {
  insights?: unknown;
}

export interface StudyOverviewInsightsResult {
  data: StudyOverviewInsight[];
  source: "api" | "fallback";
  error: Error | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeTone = (value: unknown): InsightTone | null => {
  const normalized = toStringOrNull(value)?.toLowerCase();
  if (!normalized) return null;
  if (normalized === "danger") return "danger";
  if (normalized === "warning") return "warning";
  if (normalized === "success") return "success";
  if (normalized === "info") return "info";
  return null;
};

const mapInsight = (value: unknown): StudyOverviewInsight | null => {
  if (!isRecord(value)) return null;

  const type =
    normalizeTone(value.type) ??
    normalizeTone(value.tone) ??
    normalizeTone(value.severity) ??
    "info";

  const text =
    toStringOrNull(value.text) ??
    toStringOrNull(value.message) ??
    toStringOrNull(value.recommendation) ??
    toStringOrNull(value.insight);

  if (!text) return null;

  return { type, text };
};

const parseInsights = (payload: unknown): StudyOverviewInsight[] => {
  if (Array.isArray(payload)) {
    return payload.map(mapInsight).filter((item): item is StudyOverviewInsight => item !== null);
  }

  if (!isRecord(payload)) return [];
  const mapped = payload as StudyOverviewInsightsApiResponse;

  if (!Array.isArray(mapped.insights)) return [];

  return mapped.insights
    .map(mapInsight)
    .filter((item): item is StudyOverviewInsight => item !== null);
};

export const studyOverviewInsightsService = {
  async getInsights(
    fallback: StudyOverviewInsight[],
    signal?: AbortSignal,
  ): Promise<StudyOverviewInsightsResult> {
    try {
      const response = await fetch(
        withApiBaseUrl(STUDY_OVERVIEW_INSIGHTS_PATH, STUDY_OVERVIEW_INSIGHTS_FALLBACK_URL),
        withApiRequestConfig({ method: "GET", signal }),
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.status}`);
      }

      const payload = (await response.json()) as unknown;
      return {
        data: parseInsights(payload),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error("Failed to fetch insights");
      return {
        data: fallback,
        source: "fallback",
        error: normalizedError,
      };
    }
  },
};
