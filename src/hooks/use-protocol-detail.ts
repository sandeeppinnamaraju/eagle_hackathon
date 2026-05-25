import { useQuery } from "@tanstack/react-query";
import { protocolDetailService } from "@/lib/protocol-detail-service";
import type { ProtocolDetailData } from "@/lib/protocol-detail-types";

export interface UseProtocolDetailResult {
  data: ProtocolDetailData | null;
  isLoading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
}

export function useProtocolDetail(protocolId?: string): UseProtocolDetailResult {
  const query = useQuery({
    queryKey: ["protocol-detail", protocolId],
    queryFn: ({ signal }) => protocolDetailService.getProtocolDetail(protocolId ?? "", signal),
    enabled: !!protocolId,
    staleTime: 60_000,
    retry: false,
  });

  const result = query.data ?? null;

  return {
    data: result?.data ?? null,
    isLoading: query.isLoading,
    error: result?.error ?? (query.error instanceof Error ? query.error : null),
    isUsingFallback: result?.source === "mock",
  };
}
