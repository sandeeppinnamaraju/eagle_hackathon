export interface StudyOverviewMilestoneRow {
  code: string;
  label: string;
  planned: string;
  actual: string;
  apiVarianceText: string | null;
  apiVarianceDays: number | null;
}

export interface StudyOverviewMilestonesQuery {
  studyId: string;
  fallbackRows: StudyOverviewMilestoneRow[];
}

export interface StudyOverviewMilestonesApiItem {
  code?: unknown;
  milestone?: unknown;
  label?: unknown;
  planned?: unknown;
  actual?: unknown;
  variance?: unknown;
  varianceDays?: unknown;
  variance_days?: unknown;
}

export interface StudyOverviewMilestonesApiResponse {
  studyId?: unknown;
  milestones?: unknown;
}

export interface StudyOverviewMilestonesData {
  studyId: string;
  milestones: StudyOverviewMilestoneRow[];
}

export interface StudyOverviewMilestonesResult {
  data: StudyOverviewMilestonesData;
  source: "api" | "fallback";
  error: Error | null;
}