import type { StudyOverviewContentProps } from "@/components/study-overview/types";

export type StudyOverviewSummaryData = {
  study: StudyOverviewContentProps["study"];
  detail: StudyOverviewContentProps["detail"];
};

export interface StudyOverviewSummaryResult {
  data: StudyOverviewSummaryData;
  source: "api" | "fallback";
  error: Error | null;
}

export type StudyOverviewSummaryApiResponse = Record<string, unknown>;
