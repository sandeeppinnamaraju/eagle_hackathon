import { Search, FileText, Filter, Database, Layers, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldLabel, StatChip } from "@/components/protocol-search/shared";
import {
  CountedTextarea,
  SuggestionChips,
  TherapeuticAreaSelect,
} from "@/components/protocol-search/input-elements";

interface ProtocolSearchHeroProps {
  protocolsIndexedLabel: string;
  therapyAreasLabel: string;
}

export function ProtocolSearchHero({
  protocolsIndexedLabel,
  therapyAreasLabel,
}: ProtocolSearchHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent via-card to-card p-7 shadow-card">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-60 blur-3xl"
        style={{
          background: "radial-gradient(closest-side, oklch(0.85 0.1 290 / 0.6), transparent)",
        }}
      />
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Protocol Similarity Search</h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Describe your protocol to find similar completed studies - semantic search across summary,
        indication, and eligibility criteria.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatChip icon={<Database className="h-3.5 w-3.5" />} label={protocolsIndexedLabel} />
        <StatChip icon={<Layers className="h-3.5 w-3.5" />} label={therapyAreasLabel} />
      </div>
    </section>
  );
}

interface TherapeuticAreaFilterSectionProps {
  allAreas: string[];
  selected: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleArea: (area: string) => void;
  onClearAll: () => void;
}

export function TherapeuticAreaFilterSection({
  allAreas,
  selected,
  open,
  onOpenChange,
  onToggleArea,
  onClearAll,
}: TherapeuticAreaFilterSectionProps) {
  return (
    <div>
      <FieldLabel icon={<Filter className="h-4 w-4 text-muted-foreground" />} optional>
        Therapeutic Area
        <span className="ml-1 font-normal text-muted-foreground">- narrows results</span>
      </FieldLabel>

      <div className="mt-2">
        <TherapeuticAreaSelect
          allAreas={allAreas}
          selected={selected}
          open={open}
          onOpenChange={onOpenChange}
          onToggleArea={onToggleArea}
          onClearAll={onClearAll}
        />
      </div>
    </div>
  );
}

interface ProtocolSummarySectionProps {
  summary: string;
  onSummaryChange: (value: string) => void;
  suggestions: string[];
  max: number;
}

export function ProtocolSummarySection({
  summary,
  onSummaryChange,
  suggestions,
  max,
}: ProtocolSummarySectionProps) {
  return (
    <>
      <div className="mt-6">
        <FieldLabel icon={<FileText className="h-4 w-4 text-primary" />} required>
          Protocol Summary
        </FieldLabel>
      </div>

      <CountedTextarea
        value={summary}
        onChange={onSummaryChange}
        max={max}
        rows={5}
        placeholder="Phase, indication, patient population, primary endpoint, key design features..."
        className="w-full resize-none rounded-lg border border-input bg-card px-3.5 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
      />

      <SuggestionChips suggestions={suggestions} onSelect={onSummaryChange} />
    </>
  );
}

interface EligibilityCriteriaSectionProps {
  inclusion: string;
  exclusion: string;
  onInclusionChange: (value: string) => void;
  onExclusionChange: (value: string) => void;
  inclusionMax: number;
  exclusionMax: number;
}

export function EligibilityCriteriaSection({
  inclusion,
  exclusion,
  onInclusionChange,
  onExclusionChange,
  inclusionMax,
  exclusionMax,
}: EligibilityCriteriaSectionProps) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div>
        <FieldLabel icon={<CheckCircle2 className="h-4 w-4 text-success" />} optional>
          <span className="text-success-foreground">Inclusion Criteria</span>
        </FieldLabel>
        <CountedTextarea
          value={inclusion}
          onChange={onInclusionChange}
          max={inclusionMax}
          rows={4}
          placeholder="Age range, diagnosis, prior treatment, biomarker status..."
          className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
        />
      </div>

      <div>
        <FieldLabel icon={<XCircle className="h-4 w-4 text-danger" />} optional>
          <span className="text-danger-foreground">Exclusion Criteria</span>
        </FieldLabel>
        <CountedTextarea
          value={exclusion}
          onChange={onExclusionChange}
          max={exclusionMax}
          rows={4}
          placeholder="Comorbidities, contraindications, prior treatments..."
          className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20"
        />
      </div>
    </div>
  );
}

interface FindProtocolsButtonProps {
  enabled: boolean;
  onClick: () => void;
}

export function FindProtocolsButton({ enabled, onClick }: FindProtocolsButtonProps) {
  return (
    <button
      disabled={!enabled}
      onClick={onClick}
      className={cn(
        "mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all",
        enabled
          ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
          : "cursor-not-allowed bg-muted text-muted-foreground",
      )}
    >
      <Search className="h-4 w-4" />
      Find Similar Protocols
    </button>
  );
}
