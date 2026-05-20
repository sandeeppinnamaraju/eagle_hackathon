import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ArrowLeft, X, ChevronDown, Check } from "lucide-react";
import { therapeuticAreas, protocolResults as fallbackProtocolResults } from "@/lib/data";
import { useProtocolResultsData } from "@/hooks/use-protocol-results-data";
import { DataStateBanner } from "@/components/data-state-banner";
import { PhaseBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type SearchMode = "input" | "results";

export const Route = createFileRoute("/protocol-search")({
  validateSearch: (search: Record<string, unknown>): { mode: SearchMode } => ({
    mode: search.mode === "results" ? "results" : "input",
  }),
  head: () => ({
    meta: [
      { title: "Protocol Similarity Search — Flight Deck" },
      { name: "description", content: "Find similar completed clinical study protocols and their outcomes using semantic search." },
    ],
  }),
  component: ProtocolSearchPage,
});

function ProtocolSearchPage() {
  const { mode } = Route.useSearch();
  return mode === "results" ? <ResultsView /> : <InputView />;
}

function InputView() {
  const navigate = useNavigate({ from: "/protocol-search" });
  const [summary, setSummary] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const max = 500;
  const enabled = summary.trim().length > 0;

  const toggleArea = (a: string) =>
    setSelected((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]));
  const removeArea = (a: string) => setSelected(selected.filter((x) => x !== a));
  const clearAll = () => setSelected([]);

  const triggerLabel =
    selected.length === 0
      ? "All Therapeutic Areas"
      : `${selected.length} selected`;

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-12" data-testid="protocol-search-page">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Protocol Similarity Search
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Describe your protocol to find similar completed studies and their outcomes
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-card">
        <label className="text-sm font-semibold text-foreground">Protocol Summary</label>
        <div className="relative mt-2">
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value.slice(0, max))}
            placeholder="Describe your protocol — phase, indication, patient population, primary endpoint, key design features..."
            rows={5}
            data-testid="protocol-search-summary-input"
            className="w-full resize-none rounded-lg border border-input bg-card px-3.5 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
            {summary.length}/{max}
          </span>
        </div>

        <div className="mt-5">
          <label className="text-sm font-semibold text-foreground">
            Therapeutic Area{" "}
            <span className="font-normal text-muted-foreground">(optional — select one or more)</span>
          </label>

          <div className="mt-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-testid="protocol-search-therapeutic-area-trigger"
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
              <PopoverContent
                align="start"
                sideOffset={6}
                data-testid="protocol-search-therapeutic-area-menu"
                className="w-[280px] p-0"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {selected.length} selected
                  </span>
                  {selected.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      data-testid="protocol-search-therapeutic-area-clear"
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
                        data-testid={`protocol-search-therapeutic-area-option-${a.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
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

          {selected.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.map((a) => (
                <span
                  key={a}
                  data-testid={`protocol-search-selected-area-${a.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-accent px-2 py-1 text-xs font-medium text-accent-foreground"
                >
                  {a}
                  <button
                    type="button"
                    onClick={() => removeArea(a)}
                    data-testid={`protocol-search-selected-area-remove-${a.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Remove ${a}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>



        <button
          disabled={!enabled}
          onClick={() => navigate({ search: { mode: "results" } })}
          data-testid="protocol-search-submit"
          className={cn(
            "mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
            enabled
              ? "bg-[oklch(0.18_0.03_260)] text-white hover:bg-[oklch(0.25_0.04_260)]"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          <Search className="h-4 w-4" />
          Find Similar Protocols
        </button>
      </div>
    </main>
  );
}

function matchColor(pct: number) {
  if (pct >= 80) return { text: "text-success", bar: "bg-success" };
  if (pct >= 60) return { text: "text-warning-foreground", bar: "bg-warning" };
  if (pct >= 45) return { text: "text-[oklch(0.65_0.18_50)]", bar: "bg-[oklch(0.7_0.17_50)]" };
  return { text: "text-danger", bar: "bg-danger" };
}

function ResultsView() {
  const { results, isLoading, error } = useProtocolResultsData({ fallbackResults: fallbackProtocolResults });

  return (
    <main className="mx-auto max-w-4xl px-6 py-8" data-testid="protocol-results-page" aria-busy={isLoading}>
      <span className="sr-only" role="status">
        {isLoading
          ? "Loading protocol results"
          : error
            ? "Showing fallback protocol results"
            : "Protocol results loaded"}
      </span>
      <div className="flex items-center justify-between">
        <Link
          to="/protocol-search"
          search={{ mode: "input" }}
          data-testid="protocol-results-new-search"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          New search
        </Link>
        <p className="text-sm text-muted-foreground" data-testid="protocol-results-count">
          <span className="font-semibold text-foreground">{results.length}</span> results found
        </p>
      </div>

      <DataStateBanner error={error} className="mt-4" />

      <div className="mt-5 space-y-3">
        {results.map((r) => {
          const c = matchColor(r.match);
          return (
            <article
              key={r.id}
              data-testid={`protocol-result-${r.id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
              className="rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {r.rank}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-xs font-semibold text-accent-foreground">
                      {r.id}
                    </span>
                    {r.phase ? <PhaseBadge value={r.phase} /> : <span className="text-muted-foreground">—</span>}
                    <span className="text-sm text-muted-foreground">{r.category}</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold leading-snug text-foreground">{r.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{r.indication}</p>

                  <ul className="mt-3 space-y-1">
                    {r.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground/90">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-28 shrink-0 text-right">
                  <p className={cn("text-2xl font-bold tabular-nums", c.text)}>{r.match}%</p>
                  <p className="text-xs text-muted-foreground">match</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", c.bar)} style={{ width: `${r.match}%` }} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {results.length === 0 && (
          <article className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            No protocol results available.
          </article>
        )}
      </div>
    </main>
  );
}
