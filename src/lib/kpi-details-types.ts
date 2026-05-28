import type { StudiesQuery } from "@/lib/studies-service-types";

export interface KpiDetailsApiResponse {
  active_studies?: { count?: unknown } | null;
  on_track?: { percentage?: unknown; count?: unknown } | null;
  off_track_or_at_risk?: { percentage?: unknown; count?: unknown } | null;
  enrollment_vs_target?: {
    percentage?: unknown;
    sum_actual?: unknown;
    sum_target?: unknown;
  } | null;
  schedule_adherence?: {
    percentage?: unknown;
    actual_enrollment?: unknown;
    planned_enrollment?: unknown;
    completed?: unknown;
    planned?: unknown;
  } | null;
  velocity_vs_plan?: { average?: unknown } | null;
}

export interface KpiDetailsData {
  activeStudiesCount: number;
  onTrack: {
    percentage: number;
    count: number;
  };
  offTrackOrAtRisk: {
    percentage: number;
    count: number;
  };
  enrollmentVsTarget: {
    percentage: number;
    sumActual: number;
    sumTarget: number;
  };
  scheduleAdherence: {
    percentage: number;
    completed: number;
    planned: number;
  };
  velocityVsPlan: {
    average: number;
  };
}

export type KpiDetailsQuery = Pick<
  StudiesQuery,
  | "search"
  | "therapeuticAreas"
  | "phase"
  | "status"
  | "portfolio"
  | "program"
  | "region"
  | "fpiStartDate"
  | "fpiEndDate"
  | "lpoStartDate"
  | "lpoEndDate"
>;

export interface KpiDetailsResult {
  data: KpiDetailsData | null;
  source: "api";
  error: Error | null;
}
