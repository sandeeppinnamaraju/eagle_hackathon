import type {
  KpiDetailsApiResponse,
  KpiDetailsData,
  KpiDetailsQuery,
  KpiDetailsResult,
} from "@/lib/kpi-details-types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import { buildKpiDetailsQueryParams } from "@/lib/query-param-builder";

const KPI_DETAILS_API_PATH = "/api/v1/study-protocol/kpi-details";
const KPI_DETAILS_API_FALLBACK_URL = "/api/v1/study-protocol/kpi-details";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const toNonNegativeNumber = (value: unknown): number => {
  if (!isFiniteNumber(value)) return 0;
  return value >= 0 ? value : 0;
};

const toKpiDetailsData = (payload: KpiDetailsApiResponse): KpiDetailsData => ({
  activeStudiesCount: toNonNegativeNumber(payload.active_studies?.count),
  onTrack: {
    percentage: toNonNegativeNumber(payload.on_track?.percentage),
    count: toNonNegativeNumber(payload.on_track?.count),
  },
  offTrackOrAtRisk: {
    percentage: toNonNegativeNumber(payload.off_track_or_at_risk?.percentage),
    count: toNonNegativeNumber(payload.off_track_or_at_risk?.count),
  },
  enrollmentVsTarget: {
    percentage: toNonNegativeNumber(payload.enrollment_vs_target?.percentage),
    sumActual: toNonNegativeNumber(payload.enrollment_vs_target?.sum_actual),
    sumTarget: toNonNegativeNumber(payload.enrollment_vs_target?.sum_target),
  },
  scheduleAdherence: {
    percentage: toNonNegativeNumber(payload.schedule_adherence?.percentage),
    completed: toNonNegativeNumber(
      payload.schedule_adherence?.actual_enrollment ?? payload.schedule_adherence?.completed,
    ),
    planned: toNonNegativeNumber(
      payload.schedule_adherence?.planned_enrollment ?? payload.schedule_adherence?.planned,
    ),
  },
  velocityVsPlan: {
    average: toNonNegativeNumber(payload.velocity_vs_plan?.average),
  },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null;

const hasAnyKpiSections = (payload: KpiDetailsApiResponse): boolean =>
  [
    payload.active_studies,
    payload.on_track,
    payload.off_track_or_at_risk,
    payload.enrollment_vs_target,
    payload.schedule_adherence,
    payload.velocity_vs_plan,
  ].some((section) => isRecord(section));

const fetchFromApi = async (query: KpiDetailsQuery, signal?: AbortSignal): Promise<KpiDetailsData> => {
  const kpiDetailsUrl = withApiBaseUrl(KPI_DETAILS_API_PATH, KPI_DETAILS_API_FALLBACK_URL);
  const qs = buildKpiDetailsQueryParams(query);
  const response = await fetch(
    qs ? `${kpiDetailsUrl}?${qs}` : kpiDetailsUrl,
    withApiRequestConfig({
      method: "GET",
      signal,
    }),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch KPI details: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected KPI API response shape");
  }

  if (!hasAnyKpiSections(payload as KpiDetailsApiResponse)) {
    throw new Error("Empty KPI API response");
  }

  return toKpiDetailsData(payload as KpiDetailsApiResponse);
};

export const kpiDetailsService = {
  async getKpiDetails(query: KpiDetailsQuery, signal?: AbortSignal): Promise<KpiDetailsResult> {
    try {
      const data = await fetchFromApi(query, signal);
      return {
        data,
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load KPI details from API");

      return {
        data: null,
        source: "api",
        error: normalizedError,
      };
    }
  },
};
