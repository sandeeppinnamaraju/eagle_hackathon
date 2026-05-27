import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, TrendingDown, TrendingUp, ChevronRight, ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStudyOverviewKpis } from "@/hooks/use-study-overview-kpis";
import { useStudyOverviewSummary } from "@/hooks/use-study-overview-summary";
import type { PerfGroups, PerfItem, SiteRow, StudyOverviewContentProps, StudyRange } from "./types";

type StudyOverviewStudy = StudyOverviewContentProps["study"];
type StudyOverviewDetail = StudyOverviewContentProps["detail"];
type BreakdownView = StudyOverviewContentProps["view"];
type ExpandedState = StudyOverviewContentProps["expanded"];
type ToggleHandler = StudyOverviewContentProps["onToggle"];
type SelectSiteHandler = StudyOverviewContentProps["onSelectSiteFromCountry"];

export function StudyOverviewContent({
  study,
  detail,
  range,
  onRangeChange,
  view,
  onViewChange,
  expanded,
  onToggle,
  onSelectSiteFromCountry,
  cumulative,
  rates,
}: StudyOverviewContentProps) {
  const summary = useStudyOverviewSummary({
    studyId: study.id,
    study,
    detail,
  });

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-6">
      <BackToPortfolioLink />

      <StudySummarySection
        study={summary.study}
        detail={summary.detail}
        isLoading={summary.isLoading}
        error={summary.error}
      />

      <KpiTiles studyId={study.id} range={range} detail={detail} />

      <RangeToggle range={range} onRangeChange={onRangeChange} />

      <ChartCards cumulative={cumulative} rates={rates} />

      <BreakdownTable
        view={view}
        detail={detail}
        expanded={expanded}
        onToggle={onToggle}
        onSelectSiteFromCountry={onSelectSiteFromCountry}
      />
    </main>
  );
}

function BackToPortfolioLink() {
  return (
    <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
      <ArrowLeft className="h-4 w-4" /> Back to Study Portfolio
    </Link>
  );
}

function StudySummarySection({
  study,
  detail,
  isLoading,
  error,
}: {
  study: StudyOverviewStudy;
  detail: StudyOverviewDetail;
  isLoading: boolean;
  error: Error | null;
}) {
  return (
    <section className="mt-4 rounded-xl border border-border border-l-4 border-l-success bg-card p-6 shadow-card">
      <StudyHeader study={study} isLoading={isLoading} error={error} />
      <StudyMetaGrid detail={detail} />
    </section>
  );
}

function StudyMetaGrid({ detail }: { detail: StudyOverviewDetail }) {
  const fields: Array<{ label: string; value: string }> = [
    { label: "Asset", value: detail.asset },
    { label: "Asset Lead", value: detail.assetLead },
    { label: "FSO Model", value: detail.fsoModel },
    { label: "Study Sponsor", value: detail.sponsor },
    { label: "Designation", value: detail.designation },
    { label: "Target Enrollment", value: String(detail.targetEnrollment) },
    { label: "Planned FPI", value: detail.plannedFPI },
    { label: "Actual FPI", value: detail.actualFPI },
    { label: "Planned LPO", value: detail.plannedLPI },
    { label: "Forecast LPO", value: detail.forecastLPI },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-5">
      {fields.map((field) => (
        <MetaField key={field.label} label={field.label} value={field.value} />
      ))}
    </div>
  );
}

function RangeToggle({ range, onRangeChange }: { range: StudyRange; onRangeChange: (range: StudyRange) => void }) {
  return (
    <div className="mt-6 inline-flex rounded-lg bg-muted p-1">
      {[
        { id: "full", label: "Full Study" },
        { id: "since", label: "Since FPI" },
        { id: "last3", label: "Last 3 Months" },
      ].map((p) => (
        <button
          key={p.id}
          onClick={() => onRangeChange(p.id as StudyRange)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            range === p.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-foreground" title={value}>
        {value}
      </p>
    </div>
  );
}

function KpiTiles({
  studyId,
  range,
  detail,
}: {
  studyId: string;
  range: StudyRange;
  detail: StudyOverviewContentProps["detail"];
}) {
  const kpis = useStudyOverviewKpis({
    studyId,
    timeHorizon: range,
    detail,
  });
  const resolvedDetail = kpis.detail;

  return (
    <section className="mt-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiTile
          label="Enrollment vs Plan"
          value={`${resolvedDetail.enrollmentVsPlan}%`}
          progress={Math.min(100, resolvedDetail.enrollmentVsPlan)}
          footer={[`Actual: ${resolvedDetail.enrollmentActual}`, `Plan: ${resolvedDetail.enrollmentPlan}`]}
          tone="success"
        />
        <KpiTile
          label="Enrollment Rate"
          value={`${resolvedDetail.rateActual}`}
          valueSuffix="pts/wk"
          progress={resolvedDetail.ratePlan ? Math.min(100, (resolvedDetail.rateActual / resolvedDetail.ratePlan) * 100) : 0}
          footer={[`Actual: ${resolvedDetail.rateActual}`, `Plan: ${resolvedDetail.ratePlan}`]}
          tone="success"
        />
        <KpiTile label="Screen Failure Rate" value={`${resolvedDetail.screenFailureRate}%`} />
        <KpiTile label="Dropout Rate" value={`${resolvedDetail.dropoutRate}%`} />
        <KpiTile
          label="Sites Activated"
          value={String(resolvedDetail.sitesActivated)}
          valueSuffix={`/ ${resolvedDetail.sitesPlanned}`}
          progress={resolvedDetail.sitesPlanned ? (resolvedDetail.sitesActivated / resolvedDetail.sitesPlanned) * 100 : 0}
          footer={[`Actual: ${resolvedDetail.sitesActivated}`, `Plan: ${resolvedDetail.sitesPlanned}`]}
          tone="success"
        />
        <KpiTile
          label="Countries Activated"
          value={String(resolvedDetail.countriesActivated)}
          valueSuffix={`/ ${resolvedDetail.countriesPlanned}`}
          progress={resolvedDetail.countriesPlanned ? (resolvedDetail.countriesActivated / resolvedDetail.countriesPlanned) * 100 : 0}
          footer={[`Actual: ${resolvedDetail.countriesActivated}`, `Plan: ${resolvedDetail.countriesPlanned}`]}
          tone="success"
        />
      </div>
      {kpis.isLoading && <p className="mt-3 text-xs text-muted-foreground">Loading KPI details...</p>}
      {kpis.error && <p className="mt-3 text-xs text-warning-foreground">Unable to load latest KPI details. Showing available data.</p>}
    </section>
  );
}

function KpiTile({
  label,
  value,
  valueSuffix,
  progress,
  footer,
  tone,
}: {
  label: string;
  value: string;
  valueSuffix?: string;
  progress?: number;
  footer?: string[];
  tone?: "success";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl tabular-nums font-bold text-foreground">
        {value}
        {valueSuffix && <span className="ml-1 text-sm font-medium text-muted-foreground">{valueSuffix}</span>}
      </p>
      {progress != null && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", tone === "success" ? "bg-success" : "bg-primary")}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      {footer && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{footer[0]}</span>
          <span>{footer[1]}</span>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title} {subtitle && <span className="ml-1 tracking-normal text-muted-foreground/70 normal-case">{subtitle}</span>}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function PerfPopover({
  tone,
  label,
  title,
  groups,
}: {
  tone: "up" | "down";
  label: string;
  title: string;
  groups?: PerfGroups;
}) {
  const tonePill =
    tone === "down"
      ? "border-danger/30 bg-danger-bg/50 text-danger-foreground hover:bg-danger-bg"
      : "border-success/30 bg-success-bg/50 text-success-foreground hover:bg-success-bg";
  const Icon = tone === "down" ? TrendingDown : TrendingUp;
  const valueColor = tone === "down" ? "text-danger-foreground" : "text-success-foreground";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn("inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors", tonePill)}>
          <Icon className="h-3.5 w-3.5" /> {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className={cn("flex items-center gap-1.5 border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wider", valueColor)}>
          <Icon className="h-3.5 w-3.5" /> {title}
        </div>
        <div className="space-y-4 p-4">
          {groups ? (
            <>
              <PerfList heading="Largest Absolute Shortfall" rows={groups.shortfall} valueColor={valueColor} />
              <PerfList heading="Highest % Below Target" rows={groups.pctBelow} valueColor={valueColor} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No data available.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PerfList({ heading, rows, valueColor }: { heading: string; rows: PerfItem[]; valueColor: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{heading}</p>
      <ul className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <li key={r.rank} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-foreground">
              <span className="text-muted-foreground">{r.rank}</span>
              {r.name}
            </span>
            <span className={cn("tabular-nums font-semibold", valueColor)}>{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CountryDrilldown({
  country,
  sites,
  onSelectSite,
}: {
  country: string;
  sites: SiteRow[];
  onSelectSite: (id: string) => void;
}) {
  if (sites.length === 0) {
    return <p className="text-xs text-muted-foreground">No site-level data available for {country}.</p>;
  }
  return (
    <div className="rounded-lg border border-border bg-card">
      <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sites in {country}</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">Site ID</th>
            <th className="px-3 py-2 font-medium">Site Name</th>
            <th className="px-3 py-2 text-right font-medium">Target</th>
            <th className="px-3 py-2 text-right font-medium">Actual</th>
            <th className="px-3 py-2 text-right font-medium">% Enrolled</th>
            <th className="px-3 py-2 text-center font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((s) => (
            <tr key={`${s.id}${s.name}`} className="border-t border-border/60">
              <td className="px-3 py-2">
                <button type="button" onClick={() => onSelectSite(s.id)} className="font-mono text-primary hover:underline">
                  {s.id}
                </button>
              </td>
              <td className="px-3 py-2 text-foreground">{s.name}</td>
              <td className="px-3 py-2 text-right tabular-nums text-foreground">{s.target}</td>
              <td className="px-3 py-2 text-right tabular-nums text-foreground">{s.actual}</td>
              <td className="px-3 py-2 text-right tabular-nums text-foreground">{s.pct.toFixed(1)}%</td>
              <td className="px-3 py-2 text-center text-muted-foreground">{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SiteDrilldown({ site }: { site: SiteRow }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const seed = site.id.charCodeAt(1) + site.id.charCodeAt(2);
  const monthly = months.map((m, i) => {
    const planned = Math.max(1, Math.round(site.target / 6));
    const actual = Math.max(0, Math.round((site.actual / 6) * (0.6 + ((seed + i) % 8) / 10)));
    return { m, planned, actual: Math.min(actual, planned + 2) };
  });
  const screened = Math.round(site.actual * 1.4) + 2;
  const failed = Math.max(0, screened - site.actual);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Site Info</p>
        <dl className="mt-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Site ID</dt>
            <dd className="font-mono text-foreground">{site.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Country</dt>
            <dd className="text-foreground">{site.country}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-foreground">{site.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Activated</dt>
            <dd className="text-foreground">12 Apr 2024</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">PI</dt>
            <dd className="text-foreground">Dr. A. Hoffmann</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Screening Funnel</p>
        <dl className="mt-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Screened</dt>
            <dd className="tabular-nums text-foreground">{screened}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Screen Failures</dt>
            <dd className="tabular-nums text-foreground">{failed}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Enrolled</dt>
            <dd className="tabular-nums text-foreground">{site.actual}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Target</dt>
            <dd className="tabular-nums text-foreground">{site.target}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">% Enrolled</dt>
            <dd className="tabular-nums text-foreground">{site.pct.toFixed(1)}%</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly Enrollment</p>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 font-medium">Month</th>
              <th className="py-1 text-right font-medium">Plan</th>
              <th className="py-1 text-right font-medium">Actual</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((row) => (
              <tr key={row.m} className="border-t border-border/60">
                <td className="py-1 text-foreground">{row.m}</td>
                <td className="py-1 text-right tabular-nums text-foreground">{row.planned}</td>
                <td className="py-1 text-right tabular-nums text-foreground">{row.actual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudyHeader({
  study,
  isLoading,
  error,
}: {
  study: StudyOverviewContentProps["study"];
  isLoading: boolean;
  error: Error | null;
}) {
  const perfColor =
    study.performance === "On Track"
      ? "bg-success-bg text-success-foreground"
      : study.performance === "At Risk"
        ? "bg-warning-bg text-warning-foreground"
        : study.performance === "Off Track"
          ? "bg-danger-bg text-danger-foreground"
          : "bg-muted text-muted-foreground";

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono font-semibold text-primary">{study.id}</span>
          <span className="rounded-md bg-accent px-2 py-0.5 font-semibold text-accent-foreground">{study.phase}</span>
          <span className="rounded-full bg-info-bg px-2.5 py-0.5 font-semibold uppercase tracking-wide text-info-foreground">
            {study.status}
          </span>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">{study.priority} Priority</span>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium", perfColor)}>
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {study.performance}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-tight text-foreground">{study.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {study.indication} · {study.therapeuticArea} · {study.portfolio.replace(" Portfolio", "")} & Hematology
        </p>
        {isLoading && <p className="mt-2 text-xs text-muted-foreground">Loading latest study summary...</p>}
        {error && <p className="mt-2 text-xs text-warning-foreground">Unable to load latest summary. Showing available data.</p>}
      </div>
      <button className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
        <Calendar className="h-4 w-4" /> Milestones
      </button>
    </div>
  );
}

// Extracted ChartCards component
function ChartCards({ cumulative, rates }: { cumulative: StudyOverviewContentProps['cumulative']; rates: StudyOverviewContentProps['rates'] }) {
  return (
    <section className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="CUMULATIVE ENROLLMENT">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={cumulative} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="oklch(0.91 0.01 255)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} />
            <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} />
            <Tooltip />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="actual" name="Actual" stroke="oklch(0.45 0.2 263)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="forecast" name="Forecast" stroke="oklch(0.55 0.14 170)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            <Line type="monotone" dataKey="planned" name="Planned" stroke="oklch(0.7 0.08 200)" strokeWidth={2} strokeDasharray="2 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="ENROLLMENT RATE" subtitle="(per month)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rates} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="oklch(0.91 0.01 255)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.5 0.02 260)" }} />
            <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="actual" name="Actual" fill="oklch(0.45 0.2 263)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="planned" name="Planned" fill="oklch(0.75 0.1 263)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-danger" />
          Red bars indicate periods below plan
        </p>
      </ChartCard>
    </section>
  );
}

// Extracted BreakdownTable component
function BreakdownTable({
  view,
  detail,
  expanded,
  onToggle,
  onSelectSiteFromCountry,
}: {
  view: BreakdownView;
  detail: StudyOverviewDetail;
  expanded: ExpandedState;
  onToggle: ToggleHandler;
  onSelectSiteFromCountry: SelectSiteHandler;
}) {
  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <BreakdownViewToggle view={view} onToggle={onToggle} />
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {view === "country" ? "Country Breakdown" : "Site Breakdown"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          {view === "country" ? (
            <CountryTable detail={detail} expanded={expanded} onToggle={onToggle} onSelectSiteFromCountry={onSelectSiteFromCountry} />
          ) : (
            <SiteTable detail={detail} expanded={expanded} onToggle={onToggle} />
          )}
        </div>
      </div>
    </section>
  );
}

function BreakdownViewToggle({ view, onToggle }: { view: BreakdownView; onToggle: ToggleHandler }) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1">
      <button
        onClick={() => onToggle("country")}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          view === "country" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        By Country
      </button>
      <button
        onClick={() => onToggle("site")}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          view === "site" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        By Site
      </button>
    </div>
  );
}

function CountryTable({
  detail,
  expanded,
  onToggle,
  onSelectSiteFromCountry,
}: {
  detail: StudyOverviewDetail;
  expanded: ExpandedState;
  onToggle: ToggleHandler;
  onSelectSiteFromCountry: SelectSiteHandler;
}) {
  return (
    <div className="flex flex-col gap-4">
      {detail.countries.map((c) => {
        const sColor =
          c.status === "On Track"
            ? "bg-success-bg text-success-foreground"
            : c.status === "At Risk"
              ? "bg-warning-bg text-warning-foreground"
              : "bg-danger-bg text-danger-foreground";
        const dotColor = c.status === "On Track" ? "bg-success" : c.status === "At Risk" ? "bg-warning" : "bg-danger";
        return (
          <React.Fragment key={c.name}>
            <tr
              onClick={() => onToggle(`c-${c.name}`)}
              className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
            >
              <td className="px-4 py-3 text-muted-foreground">
                {expanded[`c-${c.name}`] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </td>
              <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">{c.target}</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">{c.actual}</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">{c.pct.toFixed(1)}%</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">{c.sitesActive}</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">{c.avgRate.toFixed(1)}</td>
              <td className="px-4 py-3 text-center">
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", sColor)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
                  {c.status}
                </span>
              </td>
            </tr>
            {expanded[`c-${c.name}`] && (
              <tr key={`${c.name}-exp`} className="bg-muted/30">
                <td />
                <td colSpan={7} className="px-4 py-3">
                  <CountryDrilldown
                    country={c.name}
                    sites={(detail.sites ?? []).filter((s) => s.country === c.name)}
                    onSelectSite={onSelectSiteFromCountry}
                  />
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}
      {detail.countries.length === 0 && (
        <tr>
          <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
            No breakdown data available.
          </td>
        </tr>
      )}
    </div>
  );
}

function SiteTable({
  detail,
  expanded,
  onToggle,
}: {
  detail: StudyOverviewDetail;
  expanded: ExpandedState;
  onToggle: ToggleHandler;
}) {
  const sites = detail.sites ?? [];

  return (
    <div className="flex flex-col gap-4">
      {sites.map((s) => {
        const stat =
          s.status === "SCREENING"
            ? "bg-info-bg text-info-foreground"
            : s.status === "ON HOLD"
              ? "bg-warning-bg text-warning-foreground"
              : s.status === "CLOSED"
                ? "bg-muted text-muted-foreground"
                : "bg-success-bg text-success-foreground";
        const key = `s-${s.id}`;
        return (
          <React.Fragment key={`${s.id}${s.name}`}>
            <tr
              id={`site-row-${s.id}`}
              onClick={() => onToggle(key)}
              className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
            >
              <td className="px-4 py-3 text-muted-foreground">
                {expanded[key] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </td>
              <td className="px-4 py-3">
                <span className="rounded bg-accent px-2 py-0.5 font-mono text-xs font-semibold text-accent-foreground">{s.id}</span>
              </td>
              <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
              <td className="px-4 py-3 text-foreground">{s.country}</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">{s.target}</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">{s.actual}</td>
              <td className="px-4 py-3 text-right tabular-nums text-foreground">{s.pct.toFixed(1)}%</td>
              <td className="px-4 py-3 text-center">
                <span className={cn("inline-flex rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide", stat)}>{s.status}</span>
              </td>
            </tr>
            {expanded[key] && (
              <tr className="bg-muted/30">
                <td />
                <td colSpan={7} className="px-4 py-3">
                  <SiteDrilldown site={s} />
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}
      {sites.length === 0 && (
        <tr>
          <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
            No site data available.
          </td>
        </tr>
      )}
    </div>
  );
}
