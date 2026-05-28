import { useCallback, useEffect, useRef, useState } from "react";
import {
  studyOverviewInsightsService,
  type StudyOverviewInsight,
} from "@/lib/study-overview-insights-service";

interface UseStudyOverviewInsightsResult {
  insights: StudyOverviewInsight[];
  isLoading: boolean;
  error: Error | null;
  loadInsights: () => Promise<void>;
}

export function useStudyOverviewInsights(
  fallbackInsights: StudyOverviewInsight[],
): UseStudyOverviewInsightsResult {
  const [insights, setInsights] = useState<StudyOverviewInsight[]>(fallbackInsights);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadInsights = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    const result = await studyOverviewInsightsService.getInsights(
      fallbackInsights,
      controller.signal,
    );

    if (controller.signal.aborted) return;

    setInsights(result.data);
    setError(result.error);
    setIsLoading(false);
  }, [fallbackInsights]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    insights,
    isLoading,
    error,
    loadInsights,
  };
}
