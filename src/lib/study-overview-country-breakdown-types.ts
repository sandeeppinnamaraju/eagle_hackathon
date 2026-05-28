import type { CountryBreakdown, SiteRow, StudyRange } from "@/components/study-overview/types";

export interface StudyOverviewCountryBreakdownQuery {
  studyId: string;
  timeHorizon: StudyRange;
}

export interface StudyOverviewCountryBreakdownApiSite {
  siteId?: unknown;
  siteName?: unknown;
  target?: unknown;
  actual?: unknown;
  percentEnrolled?: unknown;
  status?: unknown;
}

export interface StudyOverviewCountryBreakdownApiCountry {
  country?: unknown;
  target?: unknown;
  actual?: unknown;
  percentEnrolled?: unknown;
  sitesActive?: unknown;
  avgRate?: unknown;
  status?: unknown;
  sites?: unknown;
}

export interface StudyOverviewCountryBreakdownApiResponse {
  timeHorizon?: unknown;
  studyId?: unknown;
  countries?: unknown;
}

export interface StudyOverviewCountryBreakdownData {
  countries: CountryBreakdown[];
  sites: SiteRow[];
  timeHorizonLabel: string;
}

export interface StudyOverviewCountryBreakdownResult {
  data: StudyOverviewCountryBreakdownData;
  source: "api";
  error: Error | null;
}
