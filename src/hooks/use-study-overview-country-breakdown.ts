import { useQuery } from "@tanstack/react-query";
import type { CountryBreakdown, SiteRow, StudyRange } from "@/components/study-overview/types";
import { studyOverviewCountryBreakdownService } from "@/lib/study-overview-country-breakdown-service";

interface UseStudyOverviewCountryBreakdownOptions {
  studyId?: string;
  timeHorizon: StudyRange;
}

interface UseStudyOverviewCountryBreakdownResult {
  countries: CountryBreakdown[];
  sites: SiteRow[];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useStudyOverviewCountryBreakdown({
  studyId,
  timeHorizon,
}: UseStudyOverviewCountryBreakdownOptions): UseStudyOverviewCountryBreakdownResult {
  const query = useQuery({
    queryKey: ["study-overview-country-breakdown", studyId, timeHorizon],
    queryFn: ({ signal }) =>
      studyOverviewCountryBreakdownService.getCountryBreakdown(
        {
          studyId: studyId ?? "",
          timeHorizon,
        },
        signal,
      ),
    enabled: !!studyId,
    staleTime: 60_000,
    retry: false,
  });

  const result = query.data;

  return {
    countries: result?.data.countries ?? [],
    sites: result?.data.sites ?? [],
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: false,
  };
}
