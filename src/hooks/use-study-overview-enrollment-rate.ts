import { useQuery } from "@tanstack/react-query";
import type { RatePoint, StudyRange } from "@/components/study-overview/types";
import { studyOverviewEnrollmentRateService } from "@/lib/study-overview-enrollment-rate-service";

interface UseStudyOverviewEnrollmentRateOptions {
  studyId?: string;
  timeHorizon: StudyRange;
  fallbackRates: RatePoint[];
}

interface UseStudyOverviewEnrollmentRateResult {
  rates: RatePoint[];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useStudyOverviewEnrollmentRate({
  studyId,
  timeHorizon,
  fallbackRates,
}: UseStudyOverviewEnrollmentRateOptions): UseStudyOverviewEnrollmentRateResult {
  const query = useQuery({
    queryKey: ["study-overview-enrollment-rate", studyId, timeHorizon],
    queryFn: ({ signal }) =>
      studyOverviewEnrollmentRateService.getEnrollmentRate(
        {
          studyId: studyId ?? "",
          timeHorizon,
          fallback: fallbackRates,
        },
        signal,
      ),
    enabled: !!studyId,
    staleTime: 60_000,
    retry: false,
  });

  const result = query.data;

  return {
    rates: result?.data.rates ?? fallbackRates,
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: result?.source === "fallback",
  };
}
