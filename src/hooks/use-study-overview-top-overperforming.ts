import { useQuery } from "@tanstack/react-query";
import type { SiteRow, StudyRange } from "@/components/study-overview/types";
import { studyOverviewTopOverperformingService } from "@/lib/study-overview-top-overperforming-service";
import type { StudyOverviewTopOverperformingMetric } from "@/lib/study-overview-top-overperforming-types";

interface UseStudyOverviewTopOverperformingOptions {
  studyId?: string;
  timeHorizon: StudyRange;
  topK: number;
  fallbackSites: SiteRow[];
}

interface UseStudyOverviewTopOverperformingResult {
  largestAbsoluteSurplus: StudyOverviewTopOverperformingMetric[];
  highestPercentAboveTarget: StudyOverviewTopOverperformingMetric[];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useStudyOverviewTopOverperforming({
  studyId,
  timeHorizon,
  topK,
  fallbackSites,
}: UseStudyOverviewTopOverperformingOptions): UseStudyOverviewTopOverperformingResult {
  const query = useQuery({
    queryKey: ["study-overview-top-overperforming", studyId, timeHorizon, topK],
    queryFn: ({ signal }) =>
      studyOverviewTopOverperformingService.getTopOverperforming(
        {
          studyId: studyId ?? "",
          timeHorizon,
          topK,
          fallbackSites,
        },
        signal,
      ),
    enabled: !!studyId,
    staleTime: 60_000,
    retry: false,
  });

  const result = query.data;

  return {
    largestAbsoluteSurplus: result?.data.largestAbsoluteSurplus ?? [],
    highestPercentAboveTarget: result?.data.highestPercentAboveTarget ?? [],
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: result?.source === "fallback",
  };
}