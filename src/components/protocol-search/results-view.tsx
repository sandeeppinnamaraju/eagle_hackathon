import { protocolResults } from "@/lib/data";
import { RESULTS_QUERY_TEXT } from "@/components/protocol-search/constants";
import {
  MatchLegend,
  ProtocolResultCard,
  QuerySummaryCard,
  ResultsHeader,
} from "@/components/protocol-search/results-sections";

export function ProtocolSearchResultsView() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <ResultsHeader resultCount={protocolResults.length} />

      <QuerySummaryCard queryText={RESULTS_QUERY_TEXT} />

      <MatchLegend />

      <div className="mt-4 space-y-3">
        {protocolResults.map((result) => (
          <ProtocolResultCard key={result.id} result={result} />
        ))}
      </div>
    </main>
  );
}
