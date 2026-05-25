import { useQuery } from "@tanstack/react-query";
import type { ProtocolResult } from "@/lib/data";
import { searchProtocols } from "@/lib/protocol-search-api";
import { loadProtocolSearchParams } from "@/lib/protocol-search-store";

export interface UseProtocolSearchResultsReturn {
  results: ProtocolResult[];
  queryText: string;
  isLoading: boolean;
  error: Error | null;
  hasSearchParams: boolean;
}

export function useProtocolSearchResults(): UseProtocolSearchResultsReturn {
  const params = loadProtocolSearchParams();
  const hasSearchParams = !!params;

  const query = useQuery({
    queryKey: ["protocol-search", params],
    queryFn: ({ signal }) => {
      if (!params) return Promise.resolve(null);
      return searchProtocols(params, signal);
    },
    enabled: hasSearchParams,
    staleTime: 60_000,
    retry: false,
  });

  const results = Array.isArray(query.data) ? query.data : [];

  const error = query.error instanceof Error ? query.error : null;

  return {
    results,
    queryText: params?.summary ?? "",
    isLoading: query.isLoading,
    error,
    hasSearchParams,
  };
}
