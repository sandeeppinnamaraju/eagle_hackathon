import type { SiteRow, StudyRange } from "@/components/study-overview/types";

export interface StudyOverviewSiteBreakdownQuery {
  studyId: string;
  timeHorizon: StudyRange;
  fallbackSites: SiteRow[];
}

export interface StudyOverviewSiteBreakdownApiSite {
  siteId?: unknown;
  siteName?: unknown;
  country?: unknown;
  target?: unknown;
  actual?: unknown;
  "%Enrolled"?: unknown;
  percentEnrolled?: unknown;
  siteStatus?: unknown;
  status?: unknown;
  details?: {
    siteId?: unknown;
    country?: unknown;
    status?: unknown;
    activatedOn?: unknown;
    pi?: unknown;
  };
  screeningFunnel?: {
    totalScreened?: unknown;
    screenFailure?: unknown;
    enrolled?: unknown;
    target?: unknown;
    "%Enrolled"?: unknown;
    percentEnrolled?: unknown;
  };
}

export interface StudyOverviewSiteBreakdownApiResponse {
  timeHorizon?: unknown;
  studyId?: unknown;
  window?: {
    startDate?: unknown;
    endDate?: unknown;
  };
  sites?: unknown;
}

export interface StudyOverviewSiteBreakdownData {
  sites: SiteRow[];
  timeHorizonLabel: string;
  window: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface StudyOverviewSiteBreakdownResult {
  data: StudyOverviewSiteBreakdownData;
  source: "api" | "fallback";
  error: Error | null;
}
