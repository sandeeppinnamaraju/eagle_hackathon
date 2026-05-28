import type { StudyRange } from "@/components/study-overview/types";

export interface StudyOverviewTopUnderperformingQuery {
  studyId: string;
  timeHorizon: StudyRange;
  topK: number;
  countryOrSite: string;
  absoluteOrPercentage: string;
}

export interface StudyOverviewTopUnderperformingApiItem {
  rank?: unknown;
  country?: unknown;
  site?: unknown;
  totalEnrolled?: unknown;
  totalTarget?: unknown;
  enrollmentPercentage?: unknown;
  absoluteShortfall?: unknown;
  shortfall?: unknown;
  "%BelowTarget"?: unknown;
}

export interface StudyOverviewTopUnderperformingApiResponse {
  timeHorizon?: unknown;
  studyId?: unknown;
  underperforming?: unknown;
  largestAbsoluteShortfall?: unknown;
  highestPercentBelowTarget?: unknown;
}

export interface StudyOverviewTopUnderperformingMetric {
  rank: number;
  site: string;
  shortfall: number | null;
  belowTargetPct: number | null;
}

export interface StudyOverviewTopUnderperformingData {
  timeHorizonLabel: string;
  studyId: string;
  largestAbsoluteShortfall: StudyOverviewTopUnderperformingMetric[];
  highestPercentBelowTarget: StudyOverviewTopUnderperformingMetric[];
}

export interface StudyOverviewTopUnderperformingResult {
  data: StudyOverviewTopUnderperformingData;
  source: "api";
  error: Error | null;
}