import { createFileRoute } from "@tanstack/react-router";
import { ProtocolSearchDetailView } from "@/components/protocol-search/detail-view";
import { ProtocolSearchInputView } from "@/components/protocol-search/input-view";
import { ProtocolSearchResultsView } from "@/components/protocol-search/results-view";
import type { SearchMode } from "@/components/protocol-search/types";

export const Route = createFileRoute("/protocol-search")({
  validateSearch: (s: Record<string, unknown>): { mode: SearchMode; id?: string } => ({
    mode: s.mode === "results" ? "results" : s.mode === "detail" ? "detail" : "input",
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Protocol Similarity Search — Flight Deck" },
      {
        name: "description",
        content:
          "AI-powered protocol similarity search across completed clinical trials with match scoring and explainability.",
      },
    ],
  }),
  component: ProtocolSearchPage,
});

function ProtocolSearchPage() {
  const { mode, id } = Route.useSearch();
  if (mode === "results") return <ProtocolSearchResultsView />;
  if (mode === "detail") return <ProtocolSearchDetailView id={id} />;
  return <ProtocolSearchInputView />;
}
