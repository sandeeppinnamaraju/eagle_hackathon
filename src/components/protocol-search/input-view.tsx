import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { therapeuticAreas } from "@/lib/data";
import {
  EligibilityCriteriaSection,
  FindProtocolsButton,
  ProtocolSearchHero,
  ProtocolSummarySection,
  TherapeuticAreaFilterSection,
} from "@/components/protocol-search/input-sections";
import { PROTOCOL_SEARCH_SUGGESTIONS } from "@/components/protocol-search/constants";

export function ProtocolSearchInputView() {
  const navigate = useNavigate({ from: "/protocol-search" });
  const [summary, setSummary] = useState("");
  const [inclusion, setInclusion] = useState("");
  const [exclusion, setExclusion] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const max = 500;
  const enabled = summary.trim().length > 0;

  const toggleArea = (area: string) => {
    setSelected((state) =>
      state.includes(area) ? state.filter((value) => value !== area) : [...state, area],
    );
  };

  const submit = () => enabled && navigate({ search: { mode: "results" } });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <ProtocolSearchHero protocolsIndexedLabel="36 protocols indexed" therapyAreasLabel="6 therapy areas" />

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
          onSummaryChange={setSummary}
          suggestions={[...PROTOCOL_SEARCH_SUGGESTIONS]}
          max={max}
        />

        <EligibilityCriteriaSection
          inclusion={inclusion}
          exclusion={exclusion}
          onInclusionChange={setInclusion}
          onExclusionChange={setExclusion}
          max={max}
        />

        <FindProtocolsButton enabled={enabled} onClick={submit} />
      </section>
    </main>
  );
}
