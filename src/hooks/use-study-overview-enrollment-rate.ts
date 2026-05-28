import { useQuery } from "@tanstack/react-query";
import type { RatePoint, StudyRange } from "@/components/study-overview/types";
import { studyOverviewEnrollmentRateService } from "@/lib/study-overview-enrollment-rate-service";

interface UseStudyOverviewEnrollmentRateOptions {
  studyId?: string;
  timeHorizon: StudyRange;
}

interface UseStudyOverviewEnrollmentRateResult {
  rates: RatePoint[];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useStudyOverviewEnrollmentRate(
  { studyId, timeHorizon }: UseStudyOverviewEnrollmentRateOptions
): UseStudyOverviewEnrollmentRateResult {
  const query = useQuery({
    queryKey: ["study-overview-enrollment-rate", studyId, timeHorizon],
    queryFn: ({ signal }) =>
      studyOverviewEnrollmentRateService.getEnrollmentRate(
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
    rates: result?.data.rates ?? [],
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: false,
  };
}
