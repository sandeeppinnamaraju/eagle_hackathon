import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { RESULTS_QUERY_TEXT } from "@/components/protocol-search/constants";
import {
  MatchLegend,
  ProtocolResultCard,
  QuerySummaryCard,
  ResultsHeader,
} from "@/components/protocol-search/results-sections";
import { useProtocolSearchResults } from "@/hooks/use-protocol-search-results";
import { protocolDetailService } from "@/lib/protocol-detail-service";

export function ProtocolSearchResultsView() {
  const navigate = useNavigate({ from: "/protocol-search" });
  const queryClient = useQueryClient();
  const [openingDetailId, setOpeningDetailId] = useState<string | null>(null);
  const { results, queryText, isLoading, error, hasSearchParams } = useProtocolSearchResults();

  const displayQueryText = queryText || RESULTS_QUERY_TEXT;

  const handleOpenDetail = async (protocolId: string) => {
    if (!protocolId || openingDetailId) return;

    setOpeningDetailId(protocolId);

    try {
      await queryClient.prefetchQuery({
        queryKey: ["protocol-detail", protocolId],
        queryFn: ({ signal }) => protocolDetailService.getProtocolDetail(protocolId, signal),
        staleTime: 60_000,
      });
    } finally {
      setOpeningDetailId(null);
      navigate({ search: { mode: "detail", id: protocolId } });
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <ResultsHeader resultCount={isLoading ? 0 : results.length} />

      <QuerySummaryCard queryText={displayQueryText} />

      <MatchLegend />

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Searching protocols…</span>
        </div>
      ) : openingDetailId ? (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading protocol details…</span>
        </div>
      ) : !hasSearchParams ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Enter criteria and click Find Results to run a protocol search.
        </div>
      ) : error ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Unable to load protocol results right now. Please try again.
        </div>
      ) : results.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          No matching protocols were found for this query.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {results.map((result) => (
            <ProtocolResultCard key={result.id} result={result} onOpenDetail={handleOpenDetail} />
          ))}
        </div>
      )}
    </main>
  );
}
