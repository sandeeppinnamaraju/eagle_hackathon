import { useQuery } from "@tanstack/react-query";
import type { SiteRow, StudyRange } from "@/components/study-overview/types";
import { studyOverviewSiteBreakdownService } from "@/lib/study-overview-site-breakdown-service";

interface UseStudyOverviewSiteBreakdownOptions {
  studyId?: string;
  timeHorizon: StudyRange;
  fallbackSites: SiteRow[];
}

interface UseStudyOverviewSiteBreakdownResult {
  sites: SiteRow[];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useStudyOverviewSiteBreakdown({
  studyId,
  timeHorizon,
  fallbackSites,
}: UseStudyOverviewSiteBreakdownOptions): UseStudyOverviewSiteBreakdownResult {
  const query = useQuery({
    queryKey: ["study-overview-site-breakdown", studyId, timeHorizon],
    queryFn: ({ signal }) =>
      studyOverviewSiteBreakdownService.getSiteBreakdown(
        {
          studyId: studyId ?? "",
          timeHorizon,
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
    sites: result?.data.sites ?? fallbackSites,
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: result?.source === "fallback",
  };
}
