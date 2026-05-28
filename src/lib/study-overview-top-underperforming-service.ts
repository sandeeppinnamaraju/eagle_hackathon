import type { SiteRow, StudyRange } from "@/components/study-overview/types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type {
  StudyOverviewTopUnderperformingApiItem,
  StudyOverviewTopUnderperformingApiResponse,
  StudyOverviewTopUnderperformingData,
  StudyOverviewTopUnderperformingMetric,
  StudyOverviewTopUnderperformingQuery,
  StudyOverviewTopUnderperformingResult,
} from "@/lib/study-overview-top-underperforming-types";

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

const buildFallbackMetrics = (sites: SiteRow[], topK: number): StudyOverviewTopUnderperformingData => {
  const k = Math.max(1, topK);

  const largestAbsoluteShortfall = sites
    .map((site) => ({
      site,
      shortfall: Math.max(0, site.target - site.actual),
    }))
    .filter((item) => item.shortfall > 0)
    .sort((a, b) => b.shortfall - a.shortfall)
    .slice(0, k)
    .map((item, index) => ({
      rank: index + 1,
      site: `${item.site.name} (${item.site.country})`,
      shortfall: item.shortfall,
      belowTargetPct: Math.max(0, Math.round(100 - item.site.pct)),
    }));

  const highestPercentBelowTarget = sites
    .map((site) => ({
      site,
      belowTargetPct: Math.max(0, 100 - site.pct),
    }))
    .filter((item) => item.belowTargetPct > 0)
    .sort((a, b) => b.belowTargetPct - a.belowTargetPct)
    .slice(0, k)
    .map((item, index) => ({
      rank: index + 1,
      site: `${item.site.name} (${item.site.country})`,
      shortfall: Math.max(0, item.site.target - item.site.actual),
      belowTargetPct: Math.round(item.belowTargetPct),
    }));

  return {
    timeHorizonLabel: "",
    studyId: "",
    largestAbsoluteShortfall,
    highestPercentBelowTarget,
  };
};

const fallbackData = (query: StudyOverviewTopUnderperformingQuery): StudyOverviewTopUnderperformingData => {
  const fallback = buildFallbackMetrics(query.fallbackSites, query.topK);

  return {
    ...fallback,
    timeHorizonLabel: toTimeHorizonLabel(query.timeHorizon),
    studyId: query.studyId,
  };
};

const mapMetricItem = (item: StudyOverviewTopUnderperformingApiItem, index: number): StudyOverviewTopUnderperformingMetric => {
  const rank = toFiniteNumber(item.rank) ?? index + 1;
  const shortfall = toFiniteNumber(item.shortfall);
  const belowTargetPct = toFiniteNumber(item["%BelowTarget"]);

  return {
    rank,
    site: toStringOrNull(item.site) ?? `Site ${index + 1}`,
    shortfall: shortfall == null ? null : Math.abs(shortfall),
    belowTargetPct: belowTargetPct == null ? null : Math.abs(belowTargetPct),
  };
};

const mapPayload = (
  payload: StudyOverviewTopUnderperformingApiResponse,
  query: StudyOverviewTopUnderperformingQuery,
): StudyOverviewTopUnderperformingData => {
  const largestAbsoluteShortfallRaw = toArrayRecords<StudyOverviewTopUnderperformingApiItem>(payload.largestAbsoluteShortfall);
  const highestPercentBelowTargetRaw = toArrayRecords<StudyOverviewTopUnderperformingApiItem>(payload.highestPercentBelowTarget);

  if (largestAbsoluteShortfallRaw.length === 0 && highestPercentBelowTargetRaw.length === 0) {
    return fallbackData(query);
  }

  return {
    timeHorizonLabel: toStringOrNull(payload.timeHorizon) ?? toTimeHorizonLabel(query.timeHorizon),
    studyId: toStringOrNull(payload.studyId) ?? query.studyId,
    largestAbsoluteShortfall: largestAbsoluteShortfallRaw.map(mapMetricItem).slice(0, query.topK),
    highestPercentBelowTarget: highestPercentBelowTargetRaw.map(mapMetricItem).slice(0, query.topK),
  };
};

async function fetchTopUnderperforming(
  query: StudyOverviewTopUnderperformingQuery,
  signal?: AbortSignal,
): Promise<StudyOverviewTopUnderperformingApiResponse> {
  const params = new URLSearchParams({
    timeHorizon: toTimeHorizonLabel(query.timeHorizon),
    studyId: query.studyId,
    topK: String(query.topK),
    countryOrSite: query.countryOrSite,
    absoluteOrPercentage: query.absoluteOrPercentage,
  });

  const path = `/api/study-overview/breakdown/top-underperforming?${params.toString()}`;
  const response = await fetch(withApiBaseUrl(path, path), withApiRequestConfig({ method: "GET", signal }));

  if (!response.ok) {
    throw new Error(`Failed to fetch top underperforming sites: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected top underperforming API response shape");
  }

  return payload as StudyOverviewTopUnderperformingApiResponse;
}

export const studyOverviewTopUnderperformingService = {
  async getTopUnderperforming(
    query: StudyOverviewTopUnderperformingQuery,
    signal?: AbortSignal,
  ): Promise<StudyOverviewTopUnderperformingResult> {
    try {
      const payload = await fetchTopUnderperforming(query, signal);
      return {
        data: mapPayload(payload, query),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load top underperforming sites from API");

      return {
        data: fallbackData(query),
        source: "fallback",
        error: normalizedError,
      };
    }
  },
};