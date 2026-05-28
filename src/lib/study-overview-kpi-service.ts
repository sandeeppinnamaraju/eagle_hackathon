import type { StudyRange } from "@/components/study-overview/types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type {
  StudyOverviewKpiApiResponse,
  StudyOverviewKpiData,
  StudyOverviewKpiQuery,
  StudyOverviewKpiResult,
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


const safeNumber = (v: unknown): number => toValueNumber(v) ?? 0;

const mapKpiPayload = (
  payload: StudyOverviewKpiApiResponse
): StudyOverviewKpiData => {
  const kpis = payload.kpis;
  if (!kpis) {
    throw new Error("No KPI data returned from API");
  }
  return {
    detail: {
      enrollmentVsPlan: safeNumber(kpis.enrollmentVsPlan?.percentage),
      enrollmentActual: safeNumber(kpis.enrollmentVsPlan?.actualEnrollments),
      enrollmentPlan: safeNumber(kpis.enrollmentVsPlan?.plannedEnrollments),
      rateActual: safeNumber(kpis.enrollmentRate?.actualEnrollmentRatePerWeek),
      ratePlan: safeNumber(kpis.enrollmentRate?.plannedEnrollmentRatePerWeek),
      screenFailureRate: safeNumber(kpis.screenFailureRate),
      dropoutRate: safeNumber(kpis.dropoutRate),
      sitesActivated: safeNumber(kpis.sitesActivated?.value ?? kpis.sitesActivated?.actualSitesActivated),
      sitesPlanned: safeNumber(kpis.sitesActivated?.plannedSitesActivated),
      countriesActivated: safeNumber(kpis.countriesActivated?.value ?? kpis.countriesActivated?.actualCountriesActivated),
      countriesPlanned: safeNumber(kpis.countriesActivated?.plannedCountriesActivated),
    },
    timeHorizonLabel: toStringOrNull(payload.timeHorizon) || "",
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
  const path = `/api/v1/study-overview/kpi-details?${params.toString()}`;
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
        data: mapKpiPayload(payload),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load study overview KPI details from API");
      return {
        data: {
          detail: {
            enrollmentVsPlan: 0,
            enrollmentActual: 0,
            enrollmentPlan: 0,
            rateActual: 0,
            ratePlan: 0,
            screenFailureRate: 0,
            dropoutRate: 0,
            sitesActivated: 0,
            sitesPlanned: 0,
            countriesActivated: 0,
            countriesPlanned: 0,
          },
          timeHorizonLabel: "",
          window: { startDate: null, endDate: null },
        },
        source: "api" as const,
        error: normalizedError,
      };
    }
  },
};
