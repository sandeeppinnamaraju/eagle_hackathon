import type { Study } from "@/lib/data";

export type StudyRange = "full" | "since" | "last3";
export type BreakdownView = "country" | "site";

export interface SiteRow {
  id: string;
  name: string;
  country: string;
  target: number;
  actual: number;
  pct: number;
  status: "ON HOLD" | "SCREENING" | "CLOSED" | "ENROLLING";
  details?: {
    siteId?: string;
    country?: string;
    status?: "ON HOLD" | "SCREENING" | "CLOSED" | "ENROLLING";
    activatedOn?: string | null;
    pi?: string | null;
  };
  screeningFunnel?: {
    totalScreened?: number;
    screenFailure?: number;
    enrolled?: number;
    target?: number;
    percentEnrolled?: number;
  };
  monthlyEnrollment?: Array<{
    month: string;
    planned: number;
    actual: number;
  }>;
}

export interface PerfItem {
  rank: number;
  name: string;
  value: string;
}

export interface PerfGroups {
  shortfall: PerfItem[];
  pctBelow: PerfItem[];
}

export interface CountryBreakdown {
  name: string;
  target: number;
  actual: number;
  pct: number;
  sitesActive: number;
  avgRate: number;
  status: "On Track" | "At Risk" | "Off Track";
}

export interface StudyDetail {
  asset: string;
  assetLead: string;
  fsoModel: string;
  sponsor: string;
  designation: string;
  targetEnrollment: number;
  plannedFPI: string;
  actualFPI: string;
  plannedLPI: string;
  forecastLPI: string;
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
  countries: CountryBreakdown[];
  sites?: SiteRow[];
  underperformingTop?: PerfGroups;
  overperformingTop?: PerfGroups;
}

export interface CumulativePoint {
  month: string;
  planned: number;
  forecast: number;
  actual: number | null;
}

export interface RatePoint {
  month: string;
  actual: number;
  planned: number;
}

export interface StudyOverviewContentProps {
  study: Study;
  detail: StudyDetail;
  range: StudyRange;
  onRangeChange: (range: StudyRange) => void;
  view: BreakdownView;
  onViewChange: (view: BreakdownView) => void;
  expanded: Record<string, boolean>;
  onToggle: (key: string) => void;
  onSelectSiteFromCountry: (siteId: string) => void;
  cumulative: CumulativePoint[];
  rates: RatePoint[];
}
