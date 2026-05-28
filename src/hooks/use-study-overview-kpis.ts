import { useQuery } from "@tanstack/react-query";
import type { StudyRange } from "@/components/study-overview/types";
import { studyOverviewKpiService } from "@/lib/study-overview-kpi-service";
import type { StudyOverviewKpiData } from "@/lib/study-overview-kpi-types";

interface UseStudyOverviewKpisOptions {
  studyId?: string;
  timeHorizon: StudyRange;
}

interface UseStudyOverviewKpisResult {
  detail: StudyOverviewKpiData["detail"];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

const emptyKpiDetail: StudyOverviewKpiData["detail"] = {
  enrollmentVsPlan: 0,
  enrollmentActual: 0,
  enrollmentPlan: 0,
  rateActual: 0,
  ratePlan: 0,
  screenFailureRate: 0,
  dropoutRate: 0,
  sitesActivated: 0,
  sitesPlanned: 0,
  countriesActivated: 0,
  countriesPlanned: 0,
};

export function useStudyOverviewKpis({
  studyId,
  timeHorizon,
}: UseStudyOverviewKpisOptions): UseStudyOverviewKpisResult {
  const query = useQuery({
    queryKey: ["study-overview-kpis", studyId, timeHorizon],
    queryFn: ({ signal }) =>
      studyOverviewKpiService.getKpis(
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
    detail: result?.data.detail ?? emptyKpiDetail,
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: false,
  };
}
