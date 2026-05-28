import { useQuery } from "@tanstack/react-query";
import { studyOverviewMilestonesService } from "@/lib/study-overview-milestones-service";
import type { StudyOverviewMilestoneRow } from "@/lib/study-overview-milestones-types";

interface UseStudyOverviewMilestonesOptions {
  studyId?: string;
}

interface UseStudyOverviewMilestonesResult {
  milestones: StudyOverviewMilestoneRow[];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useStudyOverviewMilestones({
  studyId,
}: UseStudyOverviewMilestonesOptions): UseStudyOverviewMilestonesResult {
  const query = useQuery({
    queryKey: ["study-overview-milestones", studyId],
    queryFn: ({ signal }) =>
      studyOverviewMilestonesService.getMilestones(
        {
          studyId: studyId ?? "",
        },
        signal,
      ),
    enabled: !!studyId,
    staleTime: 60_000,
    retry: false,
  });

  const result = query.data;

  return {
    milestones: result?.data.milestones ?? [],
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: false,
  };
}