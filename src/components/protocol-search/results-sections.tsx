import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PhaseBadge } from "@/components/badges";
import type { ProtocolResult } from "@/lib/data";
import { cn } from "@/lib/utils";
import { RESULT_EXCLUSION_PREVIEW_ITEMS } from "@/components/protocol-search/constants";
import {
  CriteriaPanel,
  LegendDot,
  matchTier,
  tierStyles,
} from "@/components/protocol-search/shared";

interface ResultsHeaderProps {
  resultCount: number;
}

export function ResultsHeader({ resultCount }: ResultsHeaderProps) {
  return (
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
        <span className="font-semibold text-foreground">{resultCount}</span> protocols matched
      </p>
    </div>
  );
}

interface QuerySummaryCardProps {
  queryText: string;
}

export function QuerySummaryCard({ queryText }: QuerySummaryCardProps) {
  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Your query</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{queryText}</p>
    </section>
  );
}

export function MatchLegend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Match score:</span>
      <LegendDot color="bg-success" label="≥70% High" />
      <LegendDot color="bg-warning" label="40–70% Moderate" />
      <LegendDot color="bg-muted-foreground/40" label="<40% Low" />
    </div>
  );
}

interface ProtocolResultCardProps {
  result: ProtocolResult;
}

interface ResultCardTitleLinkProps {
  id: string;
  title: string;
}

function ResultCardTitleLink({ id, title }: ResultCardTitleLinkProps) {
  return (
    <Link
      to="/protocol-search"
      search={{ mode: "detail", id }}
      className="mt-3 flex items-start gap-2 text-base font-semibold leading-snug text-foreground hover:text-primary"
    >
      <span className="flex-1">{title}</span>
      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function ResultCardFooterLink({ id }: { id: string }) {
  return (
    <Link
      to="/protocol-search"
      search={{ mode: "detail", id }}
      className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
    >
      View details
      <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export function ProtocolResultCard({ result }: ProtocolResultCardProps) {
  const tier = matchTier(result.match);
  const styles = tierStyles(tier);

  return (
    <article
      className={cn(
        "rounded-xl border border-border border-l-4 bg-card shadow-card transition-shadow hover:shadow-card-hover",
        styles.border,
      )}
    >
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {result.rank}
          </span>
          <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-xs font-semibold text-accent-foreground">
            {result.id}
          </span>
          {result.phase && <PhaseBadge value={result.phase} />}
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {result.category}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", styles.pill)}>
              {result.match}%
            </span>
            <span className="text-[11px] text-muted-foreground">{styles.label}</span>
          </div>
        </div>

        <ResultCardTitleLink id={result.id} title={result.title} />
        <p className="mt-0.5 text-sm text-muted-foreground">{result.indication}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <CriteriaPanel variant="inclusion" items={result.bullets.slice(0, 2)} />
          <CriteriaPanel
            variant="exclusion"
            items={[...RESULT_EXCLUSION_PREVIEW_ITEMS]}
          />
        </div>

        <div className="mt-4 flex items-center justify-end">
          <ResultCardFooterLink id={result.id} />
        </div>
      </div>
    </article>
  );
}
