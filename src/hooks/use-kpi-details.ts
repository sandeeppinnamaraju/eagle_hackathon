import { useEffect, useState } from "react";
import { kpiDetailsService } from "@/lib/kpi-details-service";
import type { KpiDetailsData } from "@/lib/kpi-details-types";

export interface UseKpiDetailsResult {
  data: KpiDetailsData | null;
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useKpiDetails(): UseKpiDetailsResult {
  const [data, setData] = useState<KpiDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      const result = await kpiDetailsService.getKpiDetails(controller.signal);

      if (controller.signal.aborted) return;

      setData(result.data);
      setError(result.error);
      setIsUsingFallback(result.source === "mock");
      setIsLoading(false);
    }

    load().catch((err) => {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err : new Error("Failed to load KPI details"));
      setIsLoading(false);
    });

    return () => controller.abort();
  }, []);

  return {
    data,
    isLoading,
    error,
    isUsingFallback,
  };
}
