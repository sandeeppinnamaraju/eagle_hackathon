import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { therapeuticAreas } from "@/lib/data";
import { useProtocolsSummary } from "@/hooks/use-protocols-summary";
import {
  EligibilityCriteriaSection,
  FindProtocolsButton,
  ProtocolSearchHero,
  ProtocolSummarySection,
  TherapeuticAreaFilterSection,
} from "@/components/protocol-search/input-sections";
import { PROTOCOL_SEARCH_SUGGESTIONS } from "@/components/protocol-search/constants";
import { buildSearchRequest, saveProtocolSearchParams } from "@/lib/protocol-search-store";

export function ProtocolSearchInputView() {
  const navigate = useNavigate({ from: "/protocol-search" });
  const summaryStats = useProtocolsSummary();
  const [summary, setSummary] = useState("");
  const [inclusion, setInclusion] = useState("");
  const [exclusion, setExclusion] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const max = 500;
  const totalChars = summary.length + inclusion.length + exclusion.length;
  const remainingChars = Math.max(0, max - totalChars);
  const summaryMax = max - (inclusion.length + exclusion.length);
  const inclusionMax = max - (summary.length + exclusion.length);
  const exclusionMax = max - (summary.length + inclusion.length);
  const enabled = summary.trim().length > 0;

  const handleSummaryChange = (value: string) => {
    setSummary(value.slice(0, summaryMax));
  };

  const handleInclusionChange = (value: string) => {
    setInclusion(value.slice(0, inclusionMax));
  };

  const handleExclusionChange = (value: string) => {
    setExclusion(value.slice(0, exclusionMax));
  };

  const toggleArea = (area: string) => {
    setSelected((state) =>
      state.includes(area) ? state.filter((value) => value !== area) : [...state, area],
    );
  };

  const submit = () => {
    if (!enabled) return;
    saveProtocolSearchParams(buildSearchRequest(summary, inclusion, exclusion, selected));
    navigate({ search: { mode: "results" } });
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <ProtocolSearchHero
        protocolsIndexedLabel={summaryStats.protocolsIndexedLabel}
        therapyAreasLabel={summaryStats.therapyAreasLabel}
      />

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
        <TherapeuticAreaFilterSection
          allAreas={therapeuticAreas}
          selected={selected}
          open={open}
          onOpenChange={setOpen}
          onToggleArea={toggleArea}
          onClearAll={() => setSelected([])}
        />

        <ProtocolSummarySection
          summary={summary}
          onSummaryChange={handleSummaryChange}
          suggestions={[...PROTOCOL_SEARCH_SUGGESTIONS]}
          max={summaryMax}
        />

        <EligibilityCriteriaSection
          inclusion={inclusion}
          exclusion={exclusion}
          onInclusionChange={handleInclusionChange}
          onExclusionChange={handleExclusionChange}
          inclusionMax={inclusionMax}
          exclusionMax={exclusionMax}
        />

        <p className="mt-3 text-xs text-muted-foreground">
          Max 500 characters combined across all fields.
        </p>

        <FindProtocolsButton enabled={enabled} onClick={submit} />
      </section>
    </main>
  );
}
