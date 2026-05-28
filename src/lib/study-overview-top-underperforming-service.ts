import type { StudyRange } from "@/components/study-overview/types";
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

const toArrayRecords = <T>(value: unknown): T[] => {
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

const mapMetricItem = (item: StudyOverviewTopUnderperformingApiItem, index: number): StudyOverviewTopUnderperformingMetric => {
  const rank = toFiniteNumber(item.rank) ?? index + 1;
  const totalEnrolled = toFiniteNumber(item.totalEnrolled);
  const totalTarget = toFiniteNumber(item.totalTarget);
  const absoluteShortfall = toFiniteNumber(item.absoluteShortfall);
  const shortfall = absoluteShortfall ?? toFiniteNumber(item.shortfall);
  const enrollmentPercentage = toFiniteNumber(item.enrollmentPercentage);
  const belowTargetFromEnrollment = enrollmentPercentage == null ? null : 100 - enrollmentPercentage;
  const belowTargetPct = belowTargetFromEnrollment ?? toFiniteNumber(item["%BelowTarget"]);
  const computedShortfall =
    shortfall ?? (totalEnrolled != null && totalTarget != null ? Math.max(0, totalTarget - totalEnrolled) : null);
  const label = toStringOrNull(item.site) ?? toStringOrNull(item.country);

  return {
    rank,
    site: label ?? `Site ${index + 1}`,
    shortfall: computedShortfall == null ? null : Math.abs(computedShortfall),
    belowTargetPct: belowTargetPct == null ? null : Math.abs(belowTargetPct),
  };
};

const mapPayload = (
  payload: StudyOverviewTopUnderperformingApiResponse,
  query: StudyOverviewTopUnderperformingQuery,
): StudyOverviewTopUnderperformingData => {
  const underperformingRaw = toArrayRecords<StudyOverviewTopUnderperformingApiItem>(payload.underperforming);
  const mappedUnderperforming = underperformingRaw.map(mapMetricItem).slice(0, query.topK);

  return {
    timeHorizonLabel: toStringOrNull(payload.timeHorizon) ?? toTimeHorizonLabel(query.timeHorizon),
    studyId: toStringOrNull(payload.studyId) ?? query.studyId,
    largestAbsoluteShortfall: mappedUnderperforming,
    highestPercentBelowTarget: mappedUnderperforming,
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

  const path = `/api/v1/study-overview/breakdown/top-underperforming?${params.toString()}`;
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
        data: {
          timeHorizonLabel: toTimeHorizonLabel(query.timeHorizon),
          studyId: query.studyId,
          largestAbsoluteShortfall: [],
          highestPercentBelowTarget: [],
        },
        source: "api" as const,
        error: normalizedError,
      };
    }
  },
};