import type { RatePoint, StudyRange } from "@/components/study-overview/types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type {
  StudyOverviewEnrollmentRateApiPoint,
  StudyOverviewEnrollmentRateApiResponse,
  StudyOverviewEnrollmentRateData,
  StudyOverviewEnrollmentRateQuery,
  StudyOverviewEnrollmentRateResult,
} from "@/lib/study-overview-enrollment-rate-types";

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

const toPointArray = (value: unknown): StudyOverviewEnrollmentRateApiPoint[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => isRecord(item)) as StudyOverviewEnrollmentRateApiPoint[];
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

const getFallbackData = (query: StudyOverviewEnrollmentRateQuery): StudyOverviewEnrollmentRateData => ({
  rates: query.fallback,
  timeHorizonLabel: toTimeHorizonLabel(query.timeHorizon),
  window: {
    startDate: null,
    endDate: null,
  },
});

const mapRatesFromPoints = (
  points: StudyOverviewEnrollmentRateApiPoint[],
  plannedSeries: Array<number | null>,
  actualSeries: Array<number | null>,
  fallback: RatePoint[],
): RatePoint[] => {
  return points.map((point, index) => {
    const fallbackPoint = fallback[index];
    return {
      month: toStringOrNull(point.month) ?? fallbackPoint?.month ?? `Month ${index + 1}`,
      planned: toFiniteNumber(point.planned) ?? plannedSeries[index] ?? fallbackPoint?.planned ?? 0,
      actual: toFiniteNumber(point.actual) ?? actualSeries[index] ?? fallbackPoint?.actual ?? 0,
    };
  });
};

const mapRatesFromSeries = (
  xAxis: Array<string | null>,
  plannedSeries: Array<number | null>,
  actualSeries: Array<number | null>,
  fallback: RatePoint[],
): RatePoint[] => {
  const maxLength = Math.max(xAxis.length, plannedSeries.length, actualSeries.length);
  const rates: RatePoint[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const fallbackPoint = fallback[index];
    const month = xAxis[index] ?? fallbackPoint?.month;
    const planned = plannedSeries[index] ?? fallbackPoint?.planned;
    const actual = actualSeries[index] ?? fallbackPoint?.actual;

    if (!month && planned == null && actual == null) {
      continue;
    }

    rates.push({
      month: month ?? `Month ${index + 1}`,
      planned: planned ?? 0,
      actual: actual ?? 0,
    });
  }

  return rates;
};

const mapEnrollmentRatePayload = (
  payload: StudyOverviewEnrollmentRateApiResponse,
  query: StudyOverviewEnrollmentRateQuery,
): StudyOverviewEnrollmentRateData => {
  const fallbackData = getFallbackData(query);
  const points = toPointArray(payload.points);
  const xAxis = toStringArray(payload.xAxis);
  const plannedSeries = toNumberArray(payload.series?.planned);
  const actualSeries = toNumberArray(payload.series?.actual);

  const mappedRates = points.length
    ? mapRatesFromPoints(points, plannedSeries, actualSeries, query.fallback)
    : mapRatesFromSeries(xAxis, plannedSeries, actualSeries, query.fallback);

  return {
    rates: mappedRates.length > 0 ? mappedRates : query.fallback,
    timeHorizonLabel: toStringOrNull(payload.timeHorizon) ?? fallbackData.timeHorizonLabel,
    window: {
      startDate: toStringOrNull(payload.window?.startDate) ?? null,
      endDate: toStringOrNull(payload.window?.endDate) ?? null,
    },
  };
};

async function fetchEnrollmentRate(
  query: StudyOverviewEnrollmentRateQuery,
  signal?: AbortSignal,
): Promise<StudyOverviewEnrollmentRateApiResponse> {
  const params = new URLSearchParams({
    timeHorizon: toTimeHorizonLabel(query.timeHorizon),
    studyId: query.studyId,
  });
  const path = `/api/study-overview/charts/enrollment-rate?${params.toString()}`;
  const response = await fetch(
    withApiBaseUrl(path, path),
    withApiRequestConfig({ method: "GET", signal }),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch enrollment rate chart: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected enrollment rate API response shape");
  }

  return payload as StudyOverviewEnrollmentRateApiResponse;
}

export const studyOverviewEnrollmentRateService = {
  async getEnrollmentRate(
    query: StudyOverviewEnrollmentRateQuery,
    signal?: AbortSignal,
  ): Promise<StudyOverviewEnrollmentRateResult> {
    try {
      const payload = await fetchEnrollmentRate(query, signal);
      return {
        data: mapEnrollmentRatePayload(payload, query),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load enrollment rate chart from API");

      return {
        data: getFallbackData(query),
        source: "fallback",
        error: normalizedError,
      };
    }
  },
};
