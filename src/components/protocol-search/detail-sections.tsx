import {
  Activity,
  AlertTriangle,
  Calendar,
  Lightbulb,
  MapPin,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PhaseBadge } from "@/components/badges";
import type { ProtocolResult } from "@/lib/data";
import {
  CriteriaBlock,
  InsightCard,
  MetaCell,
  OptionalCellText,
  RatioIndicator,
  Stat,
} from "@/components/protocol-search/shared";
import type { SiteRow } from "@/components/protocol-search/types";

function OptionalArchetypeValue({ value }: { value: string | null }) {
  return <OptionalCellText value={value} className="inline-flex rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground" />;
}

interface ProtocolHeaderSectionProps {
  result: ProtocolResult;
}

export function ProtocolHeaderSection({ result }: ProtocolHeaderSectionProps) {
  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-semibold text-primary">{result.id}</p>
          <h1 className="mt-2 text-xl font-bold leading-snug text-foreground">{result.title}</h1>
        </div>
        {result.phase && <PhaseBadge value={result.phase} />}
      </div>

      <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-4">
        <MetaCell label="Therapeutic area" value="Oncology" />
        <MetaCell label="Indication" value={result.indication} />
        <MetaCell label="Planned start" value="2024-09-17" icon={<Calendar className="h-3 w-3" />} />
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
  );
}

export function AIInsightsSection() {
  return (
    <section className="mt-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-accent via-card to-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-[oklch(0.55_0.18_290)] text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">AI insights</h2>
        <span className="ml-auto text-[11px] text-muted-foreground">Generated for this protocol</span>
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
  );
}

interface CriteriaSectionsProps {
  inclusionItems: string[];
  exclusionItems: string[];
}

export function CriteriaSections({ inclusionItems, exclusionItems }: CriteriaSectionsProps) {
  return (
    <section className="mt-5 grid gap-4 md:grid-cols-2">
      <CriteriaBlock variant="inclusion" items={inclusionItems} more={24} />
      <CriteriaBlock variant="exclusion" items={exclusionItems} more={31} />
    </section>
  );
}

interface EnrollmentOutcomesSectionProps {
  enrolled: number;
  target: number;
}

export function EnrollmentOutcomesSection({
  enrolled,
  target,
}: EnrollmentOutcomesSectionProps) {
  const pct = Math.round((enrolled / target) * 1000) / 10;

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Enrollment outcomes</h2>
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
  );
}

interface SitesUsedSectionProps {
  sites: SiteRow[];
}

export function SitesUsedSection({ sites }: SitesUsedSectionProps) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Sites used ({sites.length})
        </h2>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
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
            {sites.map((site) => {
              const ratioPct = Math.round((site.actual / site.target) * 100);
              return (
                <tr key={site.name} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-3 font-medium text-foreground">{site.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{site.country}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{site.target}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{site.actual}</td>
                  <td className="px-4 py-3">
                    <RatioIndicator ratioPct={ratioPct} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{site.planned}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{site.actualMo}</td>
                  <td className="px-4 py-3"><OptionalCellText value={site.siteType} /></td>
                  <td className="px-6 py-3">
                    <OptionalArchetypeValue value={site.archetype} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function LessonsLearnedSection() {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Lessons learned</h2>
      <div className="mt-3 rounded-lg border-l-4 border-primary bg-accent/40 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Operations</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground/90">
          Protocol eligibility criteria restricted enrollment to 32%; recommend broadening at design
          stage. Site coordinator training and regular performance reviews were key drivers of
          patient retention.
        </p>
      </div>
    </section>
  );
}
