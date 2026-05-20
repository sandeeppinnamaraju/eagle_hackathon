import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Check,
  FileText,
  CheckCircle2,
  XCircle,
  Filter,
  Sparkles,
  Database,
  Layers,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  MapPin,
  Calendar,
  Target as TargetIcon,
  Activity,
  Loader2,
} from "lucide-react";
import { therapeuticAreas, protocolResults, type ProtocolResult } from "@/lib/data";
import { PhaseBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type SearchMode = "input" | "results" | "detail";

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
  if (mode === "results") return <ResultsView />;
  if (mode === "detail") return <DetailView id={id} />;
  return <InputView />;
}

/* ----------------------------- INPUT VIEW ------------------------------ */

const SUGGESTIONS = [
  "Phase III oncology biologic in NSCLC",
  "EGFR-mutant lung cancer second-line therapy",
  "Severe eosinophilic asthma biologic",
  "Heart failure with preserved ejection fraction",
];

function InputView() {
  const navigate = useNavigate({ from: "/protocol-search" });
  const [summary, setSummary] = useState("");
  const [inclusion, setInclusion] = useState("");
  const [exclusion, setExclusion] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const max = 500;
  const enabled = summary.trim().length > 0;

  const toggleArea = (a: string) =>
    setSelected((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]));
  const clearAll = () => setSelected([]);

  const triggerLabel =
    selected.length === 0 ? "All Therapeutic Areas" : `${selected.length} selected`;

  const submit = () => enabled && navigate({ search: { mode: "results" } });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent via-card to-card p-7 shadow-card">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-60 blur-3xl"
          style={{
            background: "radial-gradient(closest-side, oklch(0.85 0.1 290 / 0.6), transparent)",
          }}
        />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Protocol Similarity Search
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Describe your protocol to find similar completed studies — semantic search across summary,
          indication, and eligibility criteria.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatChip icon={<Database className="h-3.5 w-3.5" />} label="36 protocols indexed" />
          <StatChip icon={<Layers className="h-3.5 w-3.5" />} label="6 therapy areas" />
        </div>
      </section>

      {/* Form card */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
        {/* Therapeutic Area */}
        <div>
          <FieldLabel icon={<Filter className="h-4 w-4 text-muted-foreground" />} optional>
            Therapeutic Area
            <span className="ml-1 font-normal text-muted-foreground">— narrows results</span>
          </FieldLabel>

          <div className="mt-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-10 min-w-[260px] items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-sm text-foreground hover:bg-muted"
                >
                  {triggerLabel}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={6} className="w-[280px] p-0">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {selected.length} selected
                  </span>
                  {selected.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-auto py-1">
                  {therapeuticAreas.map((a) => {
                    const checked = selected.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleArea(a)}
                        className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-card",
                          )}
                        >
                          {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <span className="flex-1">{a}</span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6">
          <FieldLabel icon={<FileText className="h-4 w-4 text-primary" />} required>
            Protocol Summary
          </FieldLabel>
        </div>
        <div className="relative mt-2">
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value.slice(0, max))}
            placeholder="Phase, indication, patient population, primary endpoint, key design features..."
            rows={5}
            className="w-full resize-none rounded-lg border border-input bg-card px-3.5 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
            {summary.length}/{max}
          </span>
        </div>

        {/* Suggestions */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Try:
          </span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSummary(s)}
              className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-secondary-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Inclusion / Exclusion */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel icon={<CheckCircle2 className="h-4 w-4 text-success" />} optional>
              <span className="text-success-foreground">Inclusion Criteria</span>
            </FieldLabel>
            <div className="relative mt-2">
              <textarea
                value={inclusion}
                onChange={(e) => setInclusion(e.target.value.slice(0, max))}
                placeholder="Age range, diagnosis, prior treatment, biomarker status..."
                rows={4}
                className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20"
              />
              <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
                {inclusion.length}/{max}
              </span>
            </div>
          </div>
          <div>
            <FieldLabel icon={<XCircle className="h-4 w-4 text-danger" />} optional>
              <span className="text-danger-foreground">Exclusion Criteria</span>
            </FieldLabel>
            <div className="relative mt-2">
              <textarea
                value={exclusion}
                onChange={(e) => setExclusion(e.target.value.slice(0, max))}
                placeholder="Comorbidities, contraindications, prior treatments..."
                rows={4}
                className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20"
              />
              <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
                {exclusion.length}/{max}
              </span>
            </div>
          </div>
        </div>

        <button
          disabled={!enabled}
          onClick={submit}
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
      </section>
    </main>
  );
}

function FieldLabel({
  children,
  icon,
  required,
  optional,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
      {icon}
      <span>{children}</span>
      {required && <span className="ml-1 text-[10px] font-medium text-danger">required</span>}
      {optional && (
        <span className="ml-1 text-[10px] font-medium normal-case tracking-normal text-muted-foreground">
          optional
        </span>
      )}
    </label>
  );
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card/80 px-3 py-1 text-xs font-medium text-accent-foreground backdrop-blur">
      {icon}
      {label}
    </span>
  );
}

/* ----------------------------- RESULTS VIEW ------------------------------ */

function matchTier(pct: number): "high" | "moderate" | "low" {
  if (pct >= 70) return "high";
  if (pct >= 40) return "moderate";
  return "low";
}

function tierStyles(t: "high" | "moderate" | "low") {
  if (t === "high")
    return {
      border: "border-l-success",
      pill: "bg-success-bg text-success-foreground",
      label: "High match",
    };
  if (t === "moderate")
    return {
      border: "border-l-warning",
      pill: "bg-warning-bg text-warning-foreground",
      label: "Moderate match",
    };
  return {
    border: "border-l-muted-foreground/40",
    pill: "bg-muted text-muted-foreground",
    label: "Low match",
  };
}

function ResultsView() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <Link
          to="/protocol-search"
          search={{ mode: "input" }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Refine search
        </Link>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          <span className="font-semibold text-foreground">{protocolResults.length}</span> protocols
          matched
        </p>
      </div>

      {/* Query summary */}
      <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Your query
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">
          Phase I/II first-in-human study investigating a novel fourth-generation, CNS-penetrant
          EGFR tyrosine kinase inhibitor in patients with locally advanced or metastatic EGFR-mutant
          NSCLC (exon 19 deletion or L858R) whose disease progressed on third-generation TKIs.
        </p>
      </section>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Match score:</span>
        <LegendDot color="bg-success" label="≥70% High" />
        <LegendDot color="bg-warning" label="40–70% Moderate" />
        <LegendDot color="bg-muted-foreground/40" label="<40% Low" />
      </div>

      {/* Results */}
      <div className="mt-4 space-y-3">
        {protocolResults.map((r) => (
          <ResultCard key={r.id} r={r} />
        ))}
      </div>
    </main>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-sm", color)} />
      {label}
    </span>
  );
}

function ResultCard({ r }: { r: ProtocolResult }) {
  const tier = matchTier(r.match);
  const s = tierStyles(tier);

  return (
    <article
      className={cn(
        "rounded-xl border border-border border-l-4 bg-card shadow-card transition-shadow hover:shadow-card-hover",
        s.border,
      )}
    >
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {r.rank}
          </span>
          <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-xs font-semibold text-accent-foreground">
            {r.id}
          </span>
          {r.phase && <PhaseBadge value={r.phase} />}
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {r.category}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", s.pill)}>
              {r.match}%
            </span>
            <span className="text-[11px] text-muted-foreground">{s.label}</span>
          </div>
        </div>

        <Link
          to="/protocol-search"
          search={{ mode: "detail", id: r.id }}
          className="mt-3 flex items-start gap-2 text-base font-semibold leading-snug text-foreground hover:text-primary"
        >
          <span className="flex-1">{r.title}</span>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground">{r.indication}</p>

        {/* Inclusion / Exclusion side-by-side */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <CriteriaPanel variant="inclusion" items={r.bullets.slice(0, 2)} />
          <CriteriaPanel
            variant="exclusion"
            items={[
              "Participant candidate for targeted therapies available to th…",
              "Participant with rapid progressive disease eligible to recei…",
            ]}
          />
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-end">
          <Link
            to="/protocol-search"
            search={{ mode: "detail", id: r.id }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            View details
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CriteriaPanel({
  variant,
  items,
}: {
  variant: "inclusion" | "exclusion";
  items: string[];
}) {
  const isInc = variant === "inclusion";
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        isInc ? "border-success/20 bg-success-bg/40" : "border-danger/20 bg-danger-bg/40",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
        {isInc ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-danger" />
        )}
        <span className={isInc ? "text-success-foreground" : "text-danger-foreground"}>
          {isInc ? "Inclusion" : "Exclusion"}
        </span>
      </div>
      <ul className="mt-1.5 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-xs leading-relaxed text-foreground/80">
            <span
              className={cn(
                "mt-1.5 h-1 w-1 shrink-0 rounded-full",
                isInc ? "bg-success" : "bg-danger",
              )}
            />
            <span>
              {i + 1}. {it}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExplainMatch({ r }: { r: ProtocolResult }) {
  const [loading, setLoading] = useState(true);
  if (loading) {
    setTimeout(() => setLoading(false), 600);
  }
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-[oklch(0.55_0.18_290)] text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <p className="text-sm font-semibold text-foreground">AI match explanation</p>
        <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
          {r.match}%
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing similarity…
        </div>
      ) : (
        <div className="space-y-3 pt-3 text-sm leading-relaxed text-foreground/90">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-success-foreground">
              Strong signals
            </p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Same therapeutic area & indication ({r.indication})</li>
              <li>• Overlapping phase and biomarker-driven design</li>
              <li>• Comparable primary endpoint structure</li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-warning-foreground">
              Divergences
            </p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Patient line-of-therapy differs by one</li>
              <li>• Different geographic footprint</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- DETAIL VIEW ------------------------------ */

const SITES = [
  {
    name: "Sarah Cannon Research Institute",
    country: "United States",
    target: 23,
    actual: 8,
    planned: 45,
    actualMo: 45,
    siteType: "Academic Medical Center",
    archetype: "Anchor",
  },
  {
    name: "Oncology Consultants (OC) — Houston",
    country: "United States",
    target: 14,
    actual: 4,
    planned: 45,
    actualMo: 45,
    siteType: "Community Hospital",
    archetype: "Emerging Partner",
  },
  {
    name: "Shanghai East Hospital, Tongji",
    country: "China",
    target: 20,
    actual: 6,
    planned: 45,
    actualMo: 45,
    siteType: "Research Network",
    archetype: "Competitive Battleground",
  },
  {
    name: "Tianjin Medical University Cancer Inst.",
    country: "China",
    target: 14,
    actual: 5,
    planned: 45,
    actualMo: 45,
    siteType: "Academic Medical Center",
    archetype: "Anchor",
  },
  {
    name: "Centre Léon Bérard",
    country: "France",
    target: 35,
    actual: 9,
    planned: 45,
    actualMo: 45,
    siteType: "Community Hospital",
    archetype: "Emerging Partner",
  },
  {
    name: "CHU Hôpital de la Timone",
    country: "France",
    target: 26,
    actual: 8,
    planned: 45,
    actualMo: 45,
    siteType: null,
    archetype: null,
  },
  {
    name: "Institut de Cancérologie de l'Ouest",
    country: "France",
    target: 26,
    actual: 10,
    planned: 45,
    actualMo: 45,
    siteType: null,
    archetype: null,
  },
  {
    name: "Institut Universitaire du Cancer",
    country: "France",
    target: 13,
    actual: 4,
    planned: 45,
    actualMo: 45,
    siteType: null,
    archetype: null,
  },
];

function DetailView({ id }: { id?: string }) {
  const r = useMemo(() => protocolResults.find((p) => p.id === id) ?? protocolResults[0], [id]);

  const enrolled = 54;
  const target = 171;
  const pct = Math.round((enrolled / target) * 1000) / 10;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link
        to="/protocol-search"
        search={{ mode: "results" }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to results
      </Link>

      {/* Header card */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm font-semibold text-primary">{r.id}</p>
            <h1 className="mt-2 text-xl font-bold leading-snug text-foreground">{r.title}</h1>
          </div>
          {r.phase && <PhaseBadge value={r.phase} />}
        </div>

        <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-4">
          <MetaCell label="Therapeutic area" value="Oncology" />
          <MetaCell label="Indication" value={r.indication} />
          <MetaCell
            label="Planned start"
            value="2024-09-17"
            icon={<Calendar className="h-3 w-3" />}
          />
          <MetaCell label="Actual end" value="2028-05-17" icon={<Calendar className="h-3 w-3" />} />
          <MetaCell label="Planned duration" value="45 mo" />
          <MetaCell label="Actual duration" value="45 mo" />
        </div>

        <p className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
          The goal of this First-In-Human (FIH) Phase I/II trial is to establish the safety profile,
          determine the Recommended Phase II Dose (RP2D), explore the pharmacokinetic (PK) exposure
          and pharmacodynamic (PD) properties as well as assess the efficacy of STX-241/PFL-241, a
          mutant selective Central Nervous System (CNS)-penetrant fourth generation EGFR TKI, in
          participants with locally advanced or metastatic NSCLC that progressed during or following
          third generation EGFR TKI such as osimertinib due to C797X double acquired (secondary)
          mutations.
        </p>
      </section>

      {/* AI Insights */}
      <section className="mt-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-accent via-card to-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-[oklch(0.55_0.18_290)] text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            AI insights
          </h2>
          <span className="ml-auto text-[11px] text-muted-foreground">
            Generated for this protocol
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InsightCard
            tone="risk"
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Enrollment risk"
            body="Site-level enrollment is tracking 32% of plan after 12 months. Three French sites account for 47% of remaining target."
          />
          <InsightCard
            tone="reco"
            icon={<Lightbulb className="h-4 w-4" />}
            title="Recommendation"
            body="Consider broadening inclusion to T790M co-mutation and adding 2 sites in Japan/Korea where TKI-resistant NSCLC prevalence is high."
          />
          <InsightCard
            tone="trend"
            icon={<TrendingUp className="h-4 w-4" />}
            title="Comparable trials"
            body="Similar fourth-gen EGFR TKI studies achieved RP2D in ~7 cohorts. Median activation-to-first-patient was 84 days."
          />
          <InsightCard
            tone="risk"
            icon={<Activity className="h-4 w-4" />}
            title="Operational signal"
            body="Average site activation time is 18% above benchmark. Top blocker: IRB amendment cycle in US sites."
          />
        </div>
      </section>

      {/* Inclusion/Exclusion */}
      <section className="mt-5 grid gap-4 md:grid-cols-2">
        <CriteriaBlock
          variant="inclusion"
          items={[
            "Signed and dated informed consent for participation in the trial obtained according to International Council for Harmonisation of Technical Requirements of Pharmaceuticals for Human Use (ICH) Good Clinical Practice (GCP), and national/local regulations.",
            "Male or female ≥ 18 years of age at the time of signing informed consent.",
          ]}
          more={24}
        />
        <CriteriaBlock
          variant="exclusion"
          items={[
            "Participant candidate for targeted therapies available to them (such as but not limited to therapies targeting ALK, BRAF, MET, NTRK, ROS1) as identified by local testing performed after progression to the last line of systemic therapy.",
            "Participant with rapid progressive disease eligible to receive a platinum-based chemotherapy.",
          ]}
          more={31}
        />
      </section>

      {/* Enrollment outcomes */}
      <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Enrollment outcomes
        </h2>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span>
            Enrolled: <span className="font-semibold text-foreground">{enrolled}</span>
          </span>
          <span>
            Target: <span className="font-semibold text-foreground">{target}</span>
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-danger to-warning transition-all"
            style={{ width: `${(enrolled / target) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{pct}% of target</p>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat tone="info" value={enrolled} label="Enrolled" />
          <Stat tone="muted" value={target} label="Target" />
          <Stat tone="info" value="45 mo" label="Planned duration" />
          <Stat tone="success" value="45 mo" label="Actual duration" />
        </div>
      </section>

      {/* Sites */}
      <section className="mt-5 rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Sites used ({SITES.length})
          </h2>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />3 countries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-2.5">Site</th>
                <th className="px-4 py-2.5">Country</th>
                <th className="px-4 py-2.5 text-right">Target</th>
                <th className="px-4 py-2.5 text-right">Actual</th>
                <th className="px-4 py-2.5">vs Target</th>
                <th className="px-4 py-2.5 text-right">Planned (mo)</th>
                <th className="px-4 py-2.5 text-right">Actual (mo)</th>
                <th className="px-4 py-2.5">Site Type</th>
                <th className="px-6 py-2.5">Archetype</th>
              </tr>
            </thead>
            <tbody>
              {SITES.map((s) => {
                const pct = Math.round((s.actual / s.target) * 100);
                return (
                  <tr
                    key={s.name}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-6 py-3 font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.country}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.target}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.actual}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              pct >= 70 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-danger",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-xs font-semibold tabular-nums",
                            pct >= 70
                              ? "text-success-foreground"
                              : pct >= 40
                                ? "text-warning-foreground"
                                : "text-danger-foreground",
                          )}
                        >
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.planned}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.actualMo}</td>
                    <td className="px-4 py-3">
                      {s.siteType ? (
                        <span className="text-xs text-foreground">{s.siteType}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {s.archetype ? (
                        <span className="inline-flex rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                          {s.archetype}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Lessons learned */}
      <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Lessons learned
        </h2>
        <div className="mt-3 rounded-lg border-l-4 border-primary bg-accent/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Operations</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
            Protocol eligibility criteria restricted enrollment to 32%; recommend broadening at
            design stage. Site coordinator training and regular performance reviews were key drivers
            of patient retention.
          </p>
        </div>
      </section>
    </main>
  );
}

function MetaCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground">
        {icon}
        {value}
      </p>
    </div>
  );
}

function CriteriaBlock({
  variant,
  items,
  more,
}: {
  variant: "inclusion" | "exclusion";
  items: string[];
  more: number;
}) {
  const isInc = variant === "inclusion";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
        {isInc ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <XCircle className="h-4 w-4 text-danger" />
        )}
        <span className={isInc ? "text-success-foreground" : "text-danger-foreground"}>
          {isInc ? "Inclusion criteria" : "Exclusion criteria"}
        </span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
            <span>— {it}</span>
          </li>
        ))}
      </ul>
      <button className="mt-3 text-xs font-semibold text-primary hover:underline">
        ↓ Read more ({more} more)
      </button>
    </div>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: string | number;
  label: string;
  tone: "info" | "muted" | "success";
}) {
  const map = {
    info: "bg-info-bg text-info-foreground",
    muted: "bg-muted text-foreground",
    success: "bg-success-bg text-success-foreground",
  } as const;
  return (
    <div className={cn("rounded-xl px-4 py-3 text-center", map[tone])}>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </p>
    </div>
  );
}

function InsightCard({
  tone,
  icon,
  title,
  body,
}: {
  tone: "risk" | "reco" | "trend";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const map = {
    risk: {
      ring: "border-warning/30 bg-warning-bg/40",
      iconBg: "bg-warning/15 text-warning-foreground",
    },
    reco: {
      ring: "border-success/30 bg-success-bg/40",
      iconBg: "bg-success/15 text-success-foreground",
    },
    trend: { ring: "border-primary/20 bg-accent/60", iconBg: "bg-primary/15 text-primary" },
  } as const;
  const s = map[tone];
  return (
    <div className={cn("rounded-xl border p-3.5", s.ring)}>
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", s.iconBg)}>
          {icon}
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-foreground/80">{body}</p>
    </div>
  );
}

// Suppress unused-icon TS warning
void TargetIcon;
