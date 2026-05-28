import { useQuery } from "@tanstack/react-query";
import type { SiteRow, StudyRange } from "@/components/study-overview/types";
import type { StudyOverviewTopUnderperformingMetric } from "@/lib/study-overview-top-underperforming-types";
import { studyOverviewTopUnderperformingService } from "@/lib/study-overview-top-underperforming-service";

interface UseStudyOverviewTopUnderperformingOptions {
  studyId?: string;
  timeHorizon: StudyRange;
  topK: number;
  countryOrSite: string;
  absoluteOrPercentage: string;
  fallbackSites: SiteRow[];
}

interface UseStudyOverviewTopUnderperformingResult {
  largestAbsoluteShortfall: StudyOverviewTopUnderperformingMetric[];
  highestPercentBelowTarget: StudyOverviewTopUnderperformingMetric[];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useStudyOverviewTopUnderperforming({
  studyId,
  timeHorizon,
  topK,
  countryOrSite,
  absoluteOrPercentage,
  fallbackSites,
}: UseStudyOverviewTopUnderperformingOptions): UseStudyOverviewTopUnderperformingResult {
  const query = useQuery({
    queryKey: ["study-overview-top-underperforming", studyId, timeHorizon, topK, countryOrSite, absoluteOrPercentage],
    queryFn: ({ signal }) =>
      studyOverviewTopUnderperformingService.getTopUnderperforming(
        {
          studyId: studyId ?? "",
          timeHorizon,
          topK,
          countryOrSite,
          absoluteOrPercentage,
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
    largestAbsoluteShortfall: result?.data.largestAbsoluteShortfall ?? [],
    highestPercentBelowTarget: result?.data.highestPercentBelowTarget ?? [],
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: result?.source === "fallback",
  };
}