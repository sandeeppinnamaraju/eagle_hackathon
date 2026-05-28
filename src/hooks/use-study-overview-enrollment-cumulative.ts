import { useQuery } from "@tanstack/react-query";
import type { CumulativePoint, StudyRange } from "@/components/study-overview/types";
import { studyOverviewEnrollmentCumulativeService } from "@/lib/study-overview-enrollment-cumulative-service";

interface UseStudyOverviewEnrollmentCumulativeOptions {
  studyId?: string;
  timeHorizon: StudyRange;
}

interface UseStudyOverviewEnrollmentCumulativeResult {
  cumulative: CumulativePoint[];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useStudyOverviewEnrollmentCumulative(
  { studyId, timeHorizon }: UseStudyOverviewEnrollmentCumulativeOptions
): UseStudyOverviewEnrollmentCumulativeResult {
  const query = useQuery({
    queryKey: ["study-overview-enrollment-cumulative", studyId, timeHorizon],
    queryFn: ({ signal }) =>
      studyOverviewEnrollmentCumulativeService.getEnrollmentCumulative(
        {
          studyId: studyId ?? "",
          timeHorizon,
          fallback: [],
        },
        signal,
      ),
    enabled: !!studyId,
    staleTime: 60_000,
    retry: false,
  });

  const result = query.data;

  return {
    cumulative: result?.data.cumulative ?? [],
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: false,
  };
}
