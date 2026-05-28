import type { SiteRow, StudyRange } from "@/components/study-overview/types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type {
  StudyOverviewTopOverperformingApiItem,
  StudyOverviewTopOverperformingApiResponse,
  StudyOverviewTopOverperformingData,
  StudyOverviewTopOverperformingMetric,
  StudyOverviewTopOverperformingQuery,
  StudyOverviewTopOverperformingResult,
} from "@/lib/study-overview-top-overperforming-types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toArrayRecords = <T extends Record<string, unknown>>(value: unknown): T[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => isRecord(item)) as T[];
};

const toTimeHorizonLabel = (timeHorizon: StudyRange): string => {
  switch (timeHorizon) {
    case "since":
      return "Since FPI";
    case "last3":
      return "Last 3 Months";
    case "full":
    default:
      return "Full Study";
  }
};

const buildFallbackMetrics = (sites: SiteRow[], topK: number): StudyOverviewTopOverperformingData => {
  const k = Math.max(1, topK);

  const largestAbsoluteSurplus = sites
    .map((site) => ({
      site,
      surplus: Math.max(0, site.actual - site.target),
    }))
    .filter((item) => item.surplus > 0)
    .sort((a, b) => b.surplus - a.surplus)
    .slice(0, k)
    .map((item, index) => ({
      rank: index + 1,
      site: `${item.site.name} (${item.site.country})`,
      surplus: item.surplus,
      aboveTargetPct: Math.max(0, Math.round(item.site.pct - 100)),
      achievementPct: Math.round(item.site.pct),
      performanceTier: null,
    }));

  const highestPercentAboveTarget = sites
    .map((site) => ({
      site,
      aboveTargetPct: Math.max(0, site.pct - 100),
    }))
    .filter((item) => item.aboveTargetPct > 0)
    .sort((a, b) => b.aboveTargetPct - a.aboveTargetPct)
    .slice(0, k)
    .map((item, index) => ({
      rank: index + 1,
      site: `${item.site.name} (${item.site.country})`,
      surplus: Math.max(0, item.site.actual - item.site.target),
      aboveTargetPct: Math.round(item.aboveTargetPct),
      achievementPct: Math.round(item.site.pct),
      performanceTier: null,
    }));

  return {
    timeHorizonLabel: "",
    studyId: "",
    largestAbsoluteSurplus,
    highestPercentAboveTarget,
  };
};

const fallbackData = (query: StudyOverviewTopOverperformingQuery): StudyOverviewTopOverperformingData => {
  const fallback = buildFallbackMetrics(query.fallbackSites, query.topK);

  return {
    ...fallback,
    timeHorizonLabel: toTimeHorizonLabel(query.timeHorizon),
    studyId: query.studyId,
  };
};

const mapMetricItem = (item: StudyOverviewTopOverperformingApiItem, index: number): StudyOverviewTopOverperformingMetric => {
  const rank = toFiniteNumber(item.rank) ?? index + 1;
  const surplus = toFiniteNumber(item.surplus);
  const aboveTargetPct = toFiniteNumber(item["%AboveTarget"]);
  const achievementPct = toFiniteNumber(item.achievementPct);
  const performanceTier = toStringOrNull(item.performanceTier);

  return {
    rank,
    site: toStringOrNull(item.site) ?? `Site ${index + 1}`,
    surplus: surplus == null ? null : Math.abs(surplus),
    aboveTargetPct: aboveTargetPct == null ? null : Math.abs(aboveTargetPct),
    achievementPct,
    performanceTier,
  };
};

const mapPayload = (
  payload: StudyOverviewTopOverperformingApiResponse,
  query: StudyOverviewTopOverperformingQuery,
): StudyOverviewTopOverperformingData => {
  const largestAbsoluteSurplusRaw = toArrayRecords<StudyOverviewTopOverperformingApiItem>(payload.largestAbsoluteSurplus);
  const highestPercentAboveTargetRaw = toArrayRecords<StudyOverviewTopOverperformingApiItem>(payload.highestPercentAboveTarget);

  if (largestAbsoluteSurplusRaw.length === 0 && highestPercentAboveTargetRaw.length === 0) {
    return fallbackData(query);
  }

  return {
    timeHorizonLabel: toStringOrNull(payload.timeHorizon) ?? toTimeHorizonLabel(query.timeHorizon),
    studyId: toStringOrNull(payload.studyId) ?? query.studyId,
    largestAbsoluteSurplus: largestAbsoluteSurplusRaw.map(mapMetricItem).slice(0, query.topK),
    highestPercentAboveTarget: highestPercentAboveTargetRaw.map(mapMetricItem).slice(0, query.topK),
  };
};

async function fetchTopOverperforming(
  query: StudyOverviewTopOverperformingQuery,
  signal?: AbortSignal,
): Promise<StudyOverviewTopOverperformingApiResponse> {
  const params = new URLSearchParams({
    timeHorizon: toTimeHorizonLabel(query.timeHorizon),
    studyId: query.studyId,
    topK: String(query.topK),
  });

  const path = `/api/study-overview/breakdown/top-performing?${params.toString()}`;
  const response = await fetch(withApiBaseUrl(path, path), withApiRequestConfig({ method: "GET", signal }));

  if (!response.ok) {
    throw new Error(`Failed to fetch top overperforming sites: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected top overperforming API response shape");
  }

  return payload as StudyOverviewTopOverperformingApiResponse;
}

export const studyOverviewTopOverperformingService = {
  async getTopOverperforming(
    query: StudyOverviewTopOverperformingQuery,
    signal?: AbortSignal,
  ): Promise<StudyOverviewTopOverperformingResult> {
    try {
      const payload = await fetchTopOverperforming(query, signal);
      return {
        data: mapPayload(payload, query),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load top overperforming sites from API");

      return {
        data: fallbackData(query),
        source: "fallback",
        error: normalizedError,
      };
    }
  },
};