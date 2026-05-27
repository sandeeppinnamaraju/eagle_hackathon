import { useQuery } from "@tanstack/react-query";
import type { StudyOverviewContentProps } from "@/components/study-overview/types";
import { studyOverviewSummaryService } from "@/lib/study-overview-summary-service";

interface UseStudyOverviewSummaryOptions {
  studyId?: string;
  study: StudyOverviewContentProps["study"];
  detail: StudyOverviewContentProps["detail"];
}

interface UseStudyOverviewSummaryResult {
  study: StudyOverviewContentProps["study"];
  detail: StudyOverviewContentProps["detail"];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useStudyOverviewSummary({
  studyId,
  study,
  detail,
}: UseStudyOverviewSummaryOptions): UseStudyOverviewSummaryResult {
  const fallback = { study, detail };

  const query = useQuery({
    queryKey: ["study-overview-summary", studyId],
    queryFn: ({ signal }) =>
      studyOverviewSummaryService.getSummary(studyId ?? "", fallback, signal),
    enabled: !!studyId,
    staleTime: 60_000,
    retry: false,
  });

  const result = query.data;

  return {
    study: result?.data.study ?? study,
    detail: result?.data.detail ?? detail,
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: result?.source === "fallback",
  };
}
