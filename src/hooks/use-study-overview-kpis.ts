import { useQuery } from "@tanstack/react-query";
import type { StudyOverviewContentProps, StudyRange } from "@/components/study-overview/types";
import { studyOverviewKpiService } from "@/lib/study-overview-kpi-service";

interface UseStudyOverviewKpisOptions {
  studyId?: string;
  timeHorizon: StudyRange;
  detail: StudyOverviewContentProps["detail"];
}

interface UseStudyOverviewKpisResult {
  detail: StudyOverviewContentProps["detail"];
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useStudyOverviewKpis({
  studyId,
  timeHorizon,
  detail,
}: UseStudyOverviewKpisOptions): UseStudyOverviewKpisResult {
  const query = useQuery({
    queryKey: ["study-overview-kpis", studyId, timeHorizon],
    queryFn: ({ signal }) =>
      studyOverviewKpiService.getKpis(
        {
          studyId: studyId ?? "",
          timeHorizon,
          fallback: detail,
        },
        signal,
      ),
    enabled: !!studyId,
    staleTime: 60_000,
    retry: false,
  });

  const result = query.data;

  return {
    detail: result?.data.detail ?? detail,
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: result?.source === "mock",
  };
}
