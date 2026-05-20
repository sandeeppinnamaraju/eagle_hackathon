import { useQuery } from "@tanstack/react-query";
import type { ProtocolResult } from "@/lib/data";
import { fetchProtocolResultsFromApi } from "@/lib/protocol-results-api";

interface UseProtocolResultsDataOptions {
  fallbackResults: ProtocolResult[];
}

export function useProtocolResultsData({ fallbackResults }: UseProtocolResultsDataOptions) {
  const query = useQuery({
    queryKey: ["protocol-results"],
    queryFn: ({ signal }) => fetchProtocolResultsFromApi(signal),
    staleTime: 60_000,
  });

  const results = Array.isArray(query.data) && query.data.length > 0 ? query.data : fallbackResults;
  const error = query.error ?? null;

  return {
    results,
    isLoading: query.isLoading,
    error,
  };
}
