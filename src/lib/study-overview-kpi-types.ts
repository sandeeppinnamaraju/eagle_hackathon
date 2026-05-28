import type { StudyRange } from "@/components/study-overview/types";

export interface StudyOverviewKpiValueWithReason {
  value?: unknown;
  reason?: unknown;
}

export interface StudyOverviewKpiApiResponse {
  timeHorizon?: unknown;
  studyId?: unknown;
  window?: {
    startDate?: unknown;
    endDate?: unknown;
  } | null;
  kpis?: {
    enrollmentVsPlan?: {
      percentage?: StudyOverviewKpiValueWithReason | null;
      actualEnrollments?: unknown;
      plannedEnrollments?: unknown;
    } | null;
    enrollmentRate?: {
      percentage?: StudyOverviewKpiValueWithReason | null;
      actualEnrollmentRatePerWeek?: unknown;
      plannedEnrollmentRatePerWeek?: unknown;
    } | null;
    screenFailureRate?: StudyOverviewKpiValueWithReason | null;
    dropoutRate?: StudyOverviewKpiValueWithReason | null;
    sitesActivated?: {
      value?: StudyOverviewKpiValueWithReason | null;
      actualSitesActivated?: unknown;
      plannedSitesActivated?: unknown;
    } | null;
    countriesActivated?: {
      value?: StudyOverviewKpiValueWithReason | null;
      actualCountriesActivated?: unknown;
      plannedCountriesActivated?: unknown;
    } | null;
  } | null;
}

export interface StudyOverviewKpiData {
  detail: {
    enrollmentVsPlan: number;
    enrollmentActual: number;
    enrollmentPlan: number;
    rateActual: number;
    ratePlan: number;
    screenFailureRate: number;
    dropoutRate: number;
    sitesActivated: number;
    sitesPlanned: number;
    countriesActivated: number;
    countriesPlanned: number;
  };
  timeHorizonLabel: string;
  window: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface StudyOverviewKpiQuery {
  studyId: string;
  timeHorizon: StudyRange;
}

export interface StudyOverviewKpiResult {
  data: StudyOverviewKpiData;
  source: "api";
  error: Error | null;
}
