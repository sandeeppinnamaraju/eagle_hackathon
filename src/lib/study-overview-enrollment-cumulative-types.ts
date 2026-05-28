import type { CumulativePoint, StudyRange } from "@/components/study-overview/types";

export interface StudyOverviewEnrollmentCumulativeQuery {
  studyId: string;
  timeHorizon: StudyRange;
  fallback: CumulativePoint[];
}

export interface StudyOverviewEnrollmentCumulativeApiPoint {
  month?: unknown;
  planned?: unknown;
  actual?: unknown;
  forecasted?: unknown;
  forecast?: unknown;
}

export interface StudyOverviewEnrollmentCumulativeApiResponse {
  timeHorizon?: unknown;
  studyId?: unknown;
  window?: {
    startDate?: unknown;
    endDate?: unknown;
  };
  xAxis?: unknown;
  series?: {
    planned?: unknown;
    actual?: unknown;
    forecasted?: unknown;
    forecast?: unknown;
  };
  points?: unknown;
}

export interface StudyOverviewEnrollmentCumulativeData {
  cumulative: CumulativePoint[];
  timeHorizonLabel: string;
  window: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface StudyOverviewEnrollmentCumulativeResult {
  data: StudyOverviewEnrollmentCumulativeData;
  source: "api" | "fallback";
  error: Error | null;
}
