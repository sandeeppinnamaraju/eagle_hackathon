import type { CumulativePoint, StudyRange } from "@/components/study-overview/types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type {
  StudyOverviewEnrollmentCumulativeApiPoint,
  StudyOverviewEnrollmentCumulativeApiResponse,
  StudyOverviewEnrollmentCumulativeData,
  StudyOverviewEnrollmentCumulativeQuery,
  StudyOverviewEnrollmentCumulativeResult,
} from "@/lib/study-overview-enrollment-cumulative-types";

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

const toPointArray = (value: unknown): StudyOverviewEnrollmentCumulativeApiPoint[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => isRecord(item)) as StudyOverviewEnrollmentCumulativeApiPoint[];
};

const toNumberArray = (value: unknown): Array<number | null> => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => toFiniteNumber(entry));
};

const toStringArray = (value: unknown): Array<string | null> => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => toStringOrNull(entry));
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

const getFallbackData = (query: StudyOverviewEnrollmentCumulativeQuery): StudyOverviewEnrollmentCumulativeData => ({
  cumulative: query.fallback,
  timeHorizonLabel: toTimeHorizonLabel(query.timeHorizon),
  window: {
    startDate: null,
    endDate: null,
  },
});

const mapCumulativeFromPoints = (
  points: StudyOverviewEnrollmentCumulativeApiPoint[],
  plannedSeries: Array<number | null>,
  actualSeries: Array<number | null>,
  forecastSeries: Array<number | null>,
  fallback: CumulativePoint[],
): CumulativePoint[] => {
  return points.map((point, index) => {
    const fallbackPoint = fallback[index];
    return {
      month: toStringOrNull(point.month) ?? fallbackPoint?.month ?? `Month ${index + 1}`,
      planned: toFiniteNumber(point.planned) ?? plannedSeries[index] ?? fallbackPoint?.planned ?? 0,
      actual: toFiniteNumber(point.actual) ?? actualSeries[index] ?? fallbackPoint?.actual ?? null,
      forecast:
        toFiniteNumber(point.forecasted) ??
        toFiniteNumber(point.forecast) ??
        forecastSeries[index] ??
        fallbackPoint?.forecast ??
        0,
    };
  });
};

const mapCumulativeFromSeries = (
  xAxis: Array<string | null>,
  plannedSeries: Array<number | null>,
  actualSeries: Array<number | null>,
  forecastSeries: Array<number | null>,
  fallback: CumulativePoint[],
): CumulativePoint[] => {
  const maxLength = Math.max(xAxis.length, plannedSeries.length, actualSeries.length, forecastSeries.length);
  const cumulative: CumulativePoint[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const fallbackPoint = fallback[index];
    const month = xAxis[index] ?? fallbackPoint?.month;
    const planned = plannedSeries[index] ?? fallbackPoint?.planned;
    const actual = actualSeries[index] ?? fallbackPoint?.actual;
    const forecast = forecastSeries[index] ?? fallbackPoint?.forecast;

    if (!month && planned == null && actual == null && forecast == null) {
      continue;
    }

    cumulative.push({
      month: month ?? `Month ${index + 1}`,
      planned: planned ?? 0,
      actual: actual ?? null,
      forecast: forecast ?? 0,
    });
  }

  return cumulative;
};

const mapEnrollmentCumulativePayload = (
  payload: StudyOverviewEnrollmentCumulativeApiResponse,
  query: StudyOverviewEnrollmentCumulativeQuery,
): StudyOverviewEnrollmentCumulativeData => {
  const fallbackData = getFallbackData(query);
  const points = toPointArray(payload.points);
  const xAxis = toStringArray(payload.xAxis);
  const plannedSeries = toNumberArray(payload.series?.planned);
  const actualSeries = toNumberArray(payload.series?.actual);
  const forecastSeries = toNumberArray(payload.series?.forecasted ?? payload.series?.forecast);

  const mappedCumulative = points.length
    ? mapCumulativeFromPoints(points, plannedSeries, actualSeries, forecastSeries, query.fallback)
    : mapCumulativeFromSeries(xAxis, plannedSeries, actualSeries, forecastSeries, query.fallback);

  return {
    cumulative: mappedCumulative.length > 0 ? mappedCumulative : query.fallback,
    timeHorizonLabel: toStringOrNull(payload.timeHorizon) ?? fallbackData.timeHorizonLabel,
    window: {
      startDate: toStringOrNull(payload.window?.startDate) ?? null,
      endDate: toStringOrNull(payload.window?.endDate) ?? null,
    },
  };
};

async function fetchEnrollmentCumulative(
  query: StudyOverviewEnrollmentCumulativeQuery,
  signal?: AbortSignal,
): Promise<StudyOverviewEnrollmentCumulativeApiResponse> {
  const params = new URLSearchParams({
    timeHorizon: toTimeHorizonLabel(query.timeHorizon),
    studyId: query.studyId,
  });
  const path = `/api/v1/study-overview/charts/enrollment-cumulative?${params.toString()}`;
  const response = await fetch(
    withApiBaseUrl(path, path),
    withApiRequestConfig({ method: "GET", signal }),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch cumulative enrollment chart: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected cumulative enrollment API response shape");
  }

  return payload as StudyOverviewEnrollmentCumulativeApiResponse;
}

export const studyOverviewEnrollmentCumulativeService = {
  async getEnrollmentCumulative(
    query: StudyOverviewEnrollmentCumulativeQuery,
    signal?: AbortSignal,
  ): Promise<StudyOverviewEnrollmentCumulativeResult> {
    try {
      const payload = await fetchEnrollmentCumulative(query, signal);
      return {
        data: mapEnrollmentCumulativePayload(payload, query),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load cumulative enrollment chart from API");

      return {
        data: getFallbackData(query),
        source: "fallback",
        error: normalizedError,
      };
    }
  },
};
