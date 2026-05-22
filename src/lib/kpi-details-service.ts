import { fallbackScheduleAdherence, mockKpiData } from "@/lib/mockKpiData";
import type {
  KpiDetailsApiResponse,
  KpiDetailsData,
  KpiDetailsResult,
} from "@/lib/kpi-details-types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";

const KPI_DETAILS_API_PATH = "/api/study-protocol/kpi-details";
const KPI_DETAILS_API_FALLBACK_URL = "/api/study-protocol/kpi-details";
const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== "false";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const toNonNegativeNumber = (value: unknown, fallback: number): number => {
  if (!isFiniteNumber(value)) return fallback;
  return value >= 0 ? value : fallback;
};

const toKpiDetailsData = (payload: KpiDetailsApiResponse): KpiDetailsData => ({
  activeStudiesCount: toNonNegativeNumber(payload.active_studies?.count, mockKpiData.active_studies.count),
  onTrack: {
    percentage: toNonNegativeNumber(payload.on_track?.percentage, mockKpiData.on_track.percentage),
    count: toNonNegativeNumber(payload.on_track?.count, mockKpiData.on_track.count),
  },
  offTrackOrAtRisk: {
    percentage: toNonNegativeNumber(
      payload.off_track_or_at_risk?.percentage,
      mockKpiData.off_track_or_at_risk.percentage,
    ),
    count: toNonNegativeNumber(payload.off_track_or_at_risk?.count, mockKpiData.off_track_or_at_risk.count),
  },
  enrollmentVsTarget: {
    percentage: toNonNegativeNumber(
      payload.enrollment_vs_target?.percentage,
      mockKpiData.enrollment_vs_target.percentage,
    ),
    sumActual: toNonNegativeNumber(
      payload.enrollment_vs_target?.sum_actual,
      mockKpiData.enrollment_vs_target.sum_actual,
    ),
    sumTarget: toNonNegativeNumber(
      payload.enrollment_vs_target?.sum_target,
      mockKpiData.enrollment_vs_target.sum_target,
    ),
  },
  scheduleAdherence: {
    percentage: toNonNegativeNumber(
      payload.schedule_adherence?.percentage,
      fallbackScheduleAdherence.percentage,
    ),
    completed: toNonNegativeNumber(
      payload.schedule_adherence?.completed,
      fallbackScheduleAdherence.completed,
    ),
    planned: toNonNegativeNumber(payload.schedule_adherence?.planned, fallbackScheduleAdherence.planned),
  },
  velocityVsPlan: {
    average: toNonNegativeNumber(payload.velocity_vs_plan?.average, mockKpiData.velocity_vs_plan.average),
  },
});

const getMockData = (): KpiDetailsData => toKpiDetailsData(mockKpiData);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null;

const fetchFromApi = async (signal?: AbortSignal): Promise<KpiDetailsData> => {
  const response = await fetch(
    withApiBaseUrl(KPI_DETAILS_API_PATH, KPI_DETAILS_API_FALLBACK_URL),
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

  return toKpiDetailsData(payload as KpiDetailsApiResponse);
};

export const kpiDetailsService = {
  async getKpiDetails(signal?: AbortSignal): Promise<KpiDetailsResult> {
    

    try {
      const data = await fetchFromApi(signal);
      return {
        data,
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load KPI details from API");

      return {
        data: getMockData(),
        source: "mock",
        error: normalizedError,
      };
    }
  },
};
