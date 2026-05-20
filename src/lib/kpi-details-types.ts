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

export interface KpiDetailsResult {
  data: KpiDetailsData;
  source: "api" | "mock";
  error: Error | null;
}
