import { useQuery } from "@tanstack/react-query";
import { protocolsSummaryService } from "@/lib/protocols-summary-service";

export interface UseProtocolsSummaryResult {
  protocolsIndexedLabel: string;
  therapyAreasLabel: string;
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useProtocolsSummary(): UseProtocolsSummaryResult {
  const query = useQuery({
    queryKey: ["protocols-summary"],
    queryFn: ({ signal }) => protocolsSummaryService.getProtocolsSummary(signal),
    staleTime: 60_000,
    retry: false,
  });

  const result = query.data;
  const protocolCount = result?.data.protocolCount ?? 36;
  const therapeuticAreaCount = result?.data.distinctTherapeuticAreaCount ?? 6;

  return {
    protocolsIndexedLabel: `${protocolCount} protocols indexed`,
    therapyAreasLabel: `${therapeuticAreaCount} therapy areas`,
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: result?.source === "mock",
  };
}
