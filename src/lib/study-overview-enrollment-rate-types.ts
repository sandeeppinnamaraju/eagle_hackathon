import type { RatePoint, StudyRange } from "@/components/study-overview/types";

export interface StudyOverviewEnrollmentRateQuery {
  studyId: string;
  timeHorizon: StudyRange;
  fallback: RatePoint[];
}

export interface StudyOverviewEnrollmentRateApiPoint {
  month?: unknown;
  planned?: unknown;
  actual?: unknown;
}

export interface StudyOverviewEnrollmentRateApiResponse {
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
  };
  points?: unknown;
}

export interface StudyOverviewEnrollmentRateData {
  rates: RatePoint[];
  timeHorizonLabel: string;
  window: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface StudyOverviewEnrollmentRateResult {
  data: StudyOverviewEnrollmentRateData;
  source: "api" | "fallback";
  error: Error | null;
}
