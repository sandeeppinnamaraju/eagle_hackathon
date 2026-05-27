import type { StudyRange } from "@/components/study-overview/types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type {
  StudyOverviewKpiApiResponse,
  StudyOverviewKpiData,
  StudyOverviewKpiQuery,
  StudyOverviewKpiResult,
  StudyOverviewKpiValueWithReason,
} from "@/lib/study-overview-kpi-types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toValueNumber = (value: unknown): number | null => {
  if (isRecord(value)) {
    return toFiniteNumber(value.value);
  }
  return toFiniteNumber(value);
};

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const hasKpiSections = (payload: StudyOverviewKpiApiResponse): boolean => isRecord(payload.kpis);

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

const getFallbackData = (query: StudyOverviewKpiQuery): StudyOverviewKpiData => ({
  detail: query.fallback,
  timeHorizonLabel: toTimeHorizonLabel(query.timeHorizon),
  window: {
    startDate: null,
    endDate: null,
  },
});

const mapKpiPayload = (
  payload: StudyOverviewKpiApiResponse,
  query: StudyOverviewKpiQuery,
): StudyOverviewKpiData => {
  const fallback = getFallbackData(query);
  const kpis = payload.kpis;

  if (!kpis) {
    return fallback;
  }

  return {
    detail: {
      ...query.fallback,
      enrollmentVsPlan:
        toValueNumber(kpis.enrollmentVsPlan?.percentage) ?? query.fallback.enrollmentVsPlan,
      enrollmentActual:
        toFiniteNumber(kpis.enrollmentVsPlan?.actualEnrollments) ?? query.fallback.enrollmentActual,
      enrollmentPlan:
        toFiniteNumber(kpis.enrollmentVsPlan?.plannedEnrollments) ?? query.fallback.enrollmentPlan,
      rateActual:
        toFiniteNumber(kpis.enrollmentRate?.actualEnrollmentRatePerWeek) ?? query.fallback.rateActual,
      ratePlan:
        toFiniteNumber(kpis.enrollmentRate?.plannedEnrollmentRatePerWeek) ?? query.fallback.ratePlan,
      screenFailureRate:
        toValueNumber(kpis.screenFailureRate) ?? query.fallback.screenFailureRate,
      dropoutRate:
        toValueNumber(kpis.dropoutRate) ?? query.fallback.dropoutRate,
      sitesActivated:
        toValueNumber(kpis.sitesActivated?.value) ??
        toFiniteNumber(kpis.sitesActivated?.actualSitesActivated) ??
        query.fallback.sitesActivated,
      sitesPlanned:
        toFiniteNumber(kpis.sitesActivated?.plannedSitesActivated) ?? query.fallback.sitesPlanned,
      countriesActivated:
        toValueNumber(kpis.countriesActivated?.value) ??
        toFiniteNumber(kpis.countriesActivated?.actualCountriesActivated) ??
        query.fallback.countriesActivated,
      countriesPlanned:
        toFiniteNumber(kpis.countriesActivated?.plannedCountriesActivated) ?? query.fallback.countriesPlanned,
    },
    timeHorizonLabel: toStringOrNull(payload.timeHorizon) ?? fallback.timeHorizonLabel,
    window: {
      startDate: toStringOrNull(payload.window?.startDate) ?? null,
      endDate: toStringOrNull(payload.window?.endDate) ?? null,
    },
  };
};

async function fetchStudyOverviewKpis(
  query: StudyOverviewKpiQuery,
  signal?: AbortSignal,
): Promise<StudyOverviewKpiApiResponse> {
  const params = new URLSearchParams({
    timeHorizon: toTimeHorizonLabel(query.timeHorizon),
    studyId: query.studyId,
  });
  const path = `/api/study-overview/kpi-details?${params.toString()}`;
  const response = await fetch(
    withApiBaseUrl(path, path),
    withApiRequestConfig({ method: "GET", signal }),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch study overview KPI details: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected study overview KPI API response shape");
  }

  return payload as StudyOverviewKpiApiResponse;
}

export const studyOverviewKpiService = {
  async getKpis(query: StudyOverviewKpiQuery, signal?: AbortSignal): Promise<StudyOverviewKpiResult> {
    try {
      const payload = await fetchStudyOverviewKpis(query, signal);
      if (!hasKpiSections(payload)) {
        throw new Error("Empty study overview KPI API response");
      }

      return {
        data: mapKpiPayload(payload, query),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load study overview KPI details from API");

      return {
        data: getFallbackData(query),
        source: "mock",
        error: normalizedError,
      };
    }
  },
};
