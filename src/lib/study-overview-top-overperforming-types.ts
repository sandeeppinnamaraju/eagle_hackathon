import type { SiteRow, StudyRange } from "@/components/study-overview/types";

export interface StudyOverviewTopOverperformingQuery {
  studyId: string;
  timeHorizon: StudyRange;
  topK: number;
  countryOrSite: string;
  absoluteOrPercentage: string;
  fallbackSites: SiteRow[];
}

export interface StudyOverviewTopOverperformingApiItem {
  rank?: unknown;
  country?: unknown;
  site?: unknown;
  totalEnrolled?: unknown;
  totalTarget?: unknown;
  enrollmentPercentage?: unknown;
  absoluteSurplus?: unknown;
  surplus?: unknown;
  "%AboveTarget"?: unknown;
  achievementPct?: unknown;
  performanceTier?: unknown;
}

export interface StudyOverviewTopOverperformingApiResponse {
  timeHorizon?: unknown;
  studyId?: unknown;
  overperforming?: unknown;
  largestAbsoluteSurplus?: unknown;
  highestPercentAboveTarget?: unknown;
}

export interface StudyOverviewTopOverperformingMetric {
  rank: number;
  site: string;
  surplus: number | null;
  aboveTargetPct: number | null;
  achievementPct: number | null;
  performanceTier: string | null;
}

export interface StudyOverviewTopOverperformingData {
  timeHorizonLabel: string;
  studyId: string;
  largestAbsoluteSurplus: StudyOverviewTopOverperformingMetric[];
  highestPercentAboveTarget: StudyOverviewTopOverperformingMetric[];
}

export interface StudyOverviewTopOverperformingResult {
  data: StudyOverviewTopOverperformingData;
  source: "api" | "fallback";
  error: Error | null;
}