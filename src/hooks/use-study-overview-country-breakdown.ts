import { useQuery } from "@tanstack/react-query";
import type { CountryBreakdown, SiteRow, StudyRange } from "@/components/study-overview/types";
import { studyOverviewCountryBreakdownService } from "@/lib/study-overview-country-breakdown-service";

interface UseStudyOverviewCountryBreakdownOptions {
  studyId?: string;
  timeHorizon: StudyRange;
  fallbackCountries: CountryBreakdown[];
  fallbackSites: SiteRow[];
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
  fallbackCountries,
  fallbackSites,
}: UseStudyOverviewCountryBreakdownOptions): UseStudyOverviewCountryBreakdownResult {
  const query = useQuery({
    queryKey: ["study-overview-country-breakdown", studyId, timeHorizon],
    queryFn: ({ signal }) =>
      studyOverviewCountryBreakdownService.getCountryBreakdown(
        {
          studyId: studyId ?? "",
          timeHorizon,
          fallbackCountries,
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
    countries: result?.data.countries ?? fallbackCountries,
    sites: result?.data.sites ?? fallbackSites,
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: result?.source === "fallback",
  };
}
