import type { SiteRow, StudyRange } from "@/components/study-overview/types";

export interface StudyOverviewTopUnderperformingQuery {
  studyId: string;
  timeHorizon: StudyRange;
  topK: number;
  fallbackSites: SiteRow[];
}

export interface StudyOverviewTopUnderperformingApiItem {
  rank?: unknown;
  site?: unknown;
  shortfall?: unknown;
  "%BelowTarget"?: unknown;
}

export interface StudyOverviewTopUnderperformingApiResponse {
  timeHorizon?: unknown;
  studyId?: unknown;
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
  source: "api" | "fallback";
  error: Error | null;
}