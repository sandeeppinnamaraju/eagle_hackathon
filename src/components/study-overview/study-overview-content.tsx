import * as React from "react";
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
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStudyOverviewCountryBreakdown } from "@/hooks/use-study-overview-country-breakdown";
import { useStudyOverviewEnrollmentCumulative } from "@/hooks/use-study-overview-enrollment-cumulative";
import { useStudyOverviewEnrollmentRate } from "@/hooks/use-study-overview-enrollment-rate";
import { useStudyOverviewKpis } from "@/hooks/use-study-overview-kpis";
import { useStudyOverviewMilestones } from "@/hooks/use-study-overview-milestones";
import { useStudyOverviewSiteBreakdown } from "@/hooks/use-study-overview-site-breakdown";
import { useStudyOverviewSummary } from "@/hooks/use-study-overview-summary";
import { useStudyOverviewTopOverperforming } from "@/hooks/use-study-overview-top-overperforming";
import { useStudyOverviewTopUnderperforming } from "@/hooks/use-study-overview-top-underperforming";
import type { StudyOverviewMilestoneRow } from "@/lib/study-overview-milestones-types";
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
  onSelectPerformanceTarget,
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

      <RangeToggle range={range} onRangeChange={onRangeChange} />

      <KpiTiles studyId={study.id} range={range} />

      <ChartCards studyId={study.id} range={range} cumulative={cumulative} rates={rates} />

      <BreakdownTable
        studyId={study.id}
        range={range}
        view={view}
        onViewChange={onViewChange}
        detail={detail}
        expanded={expanded}
        onToggle={onToggle}
        onSelectPerformanceTarget={onSelectPerformanceTarget}
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
      <StudyHeader study={study} detail={detail} isLoading={isLoading} error={error} />
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
}: {
  studyId: string;
  range: StudyRange;
}) {
  const kpis = useStudyOverviewKpis({
    studyId,
    timeHorizon: range,
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
      {kpis.error && <p className="mt-3 text-xs text-warning-foreground">Unable to load latest KPI details.</p>}
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
  const detailInfo = site.details;
  const funnelInfo = site.screeningFunnel;
  const siteCountry = detailInfo?.country ?? site.country;
  const siteStatus = detailInfo?.status ?? site.status;
  const activatedOn = detailInfo?.activatedOn ?? "—";
  const principalInvestigator = detailInfo?.pi ?? "—";
  const monthly: { month: string; planned: number; actual: number }[] | undefined =
    Array.isArray(site.monthlyEnrollment) && site.monthlyEnrollment.length > 0 ? site.monthlyEnrollment : undefined;
  const screened = funnelInfo?.totalScreened ?? Math.round(site.actual * 1.4) + 2;
  const failed = funnelInfo?.screenFailure ?? Math.max(0, screened - site.actual);
  const enrolled = funnelInfo?.enrolled ?? site.actual;
  const funnelTarget = funnelInfo?.target ?? site.target;
  const enrolledPct = funnelInfo?.percentEnrolled ?? site.pct;

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
            <dd className="text-foreground">{siteCountry}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-foreground">{siteStatus}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Activated</dt>
            <dd className="text-foreground">{activatedOn}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">PI</dt>
            <dd className="text-foreground">{principalInvestigator}</dd>
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
            <dd className="tabular-nums text-foreground">{enrolled}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Target</dt>
            <dd className="tabular-nums text-foreground">{funnelTarget}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">% Enrolled</dt>
            <dd className="tabular-nums text-foreground">{enrolledPct.toFixed(1)}%</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly Enrollment</p>
        {monthly ? (
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
                <tr key={row.month} className="border-t border-border/60">
                  <td className="py-1 text-foreground">{row.month}</td>
                  <td className="py-1 text-right tabular-nums text-foreground">{row.planned}</td>
                  <td className="py-1 text-right tabular-nums text-foreground">{row.actual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">No monthly enrollment data available.</p>
        )}
      </div>
    </div>
  );
}

function StudyHeader({
  study,
  detail,
  isLoading,
  error,
}: {
  study: StudyOverviewContentProps["study"];
  detail: StudyOverviewDetail;
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
      <MilestonesPopover studyId={study.id} />
    </div>
  );
}

function parseDate(value: string): Date | null {
  if (!value || value === "—") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}


function variance(planned: string, actual: string): { text: string; tone: "neutral" | "ok" | "warn" | "bad" } {
  if (!actual || actual === "—") return { text: "Pending", tone: "neutral" };

  const plannedDate = parseDate(planned);
  const actualDate = parseDate(actual);
  if (!plannedDate || !actualDate) return { text: "—", tone: "neutral" };

  const diffDays = Math.round((actualDate.getTime() - plannedDate.getTime()) / 86400000);
  if (diffDays <= 0) return { text: "On time", tone: "ok" };
  if (diffDays <= 14) return { text: `+${diffDays}d`, tone: "warn" };
  return { text: `+${diffDays}d`, tone: "bad" };
}

function varianceFromApi(row: StudyOverviewMilestoneRow): { text: string; tone: "neutral" | "ok" | "warn" | "bad" } | null {
  if (row.apiVarianceDays != null) {
    if (row.apiVarianceDays <= 0) return { text: "On time", tone: "ok" };
    if (row.apiVarianceDays <= 14) return { text: `+${row.apiVarianceDays}d`, tone: "warn" };
    return { text: `+${row.apiVarianceDays}d`, tone: "bad" };
  }

  if (!row.apiVarianceText) return null;

  const normalized = row.apiVarianceText.toLowerCase();
  if (normalized.includes("pending")) return { text: row.apiVarianceText, tone: "neutral" };
  if (normalized.includes("on time") || normalized.includes("ahead")) return { text: row.apiVarianceText, tone: "ok" };
  if (normalized.includes("delay") || normalized.includes("late")) return { text: row.apiVarianceText, tone: "bad" };
  return { text: row.apiVarianceText, tone: "neutral" };
}

function MilestonesPopover({ studyId }: { studyId: string }) {
  const milestones = useStudyOverviewMilestones({
    studyId,
  });
  const rows = milestones.milestones;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
          <Calendar className="h-4 w-4" /> Milestones
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[520px] rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Milestone Dates</h3>
        {milestones.isLoading && <p className="mt-2 text-xs text-muted-foreground">Loading milestone dates...</p>}
        {milestones.error && (
          <p className="mt-2 text-xs text-warning-foreground">Unable to load latest milestone dates.</p>
        )}
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 text-xs font-semibold text-muted-foreground">
                <th className="px-3 py-2 text-left">Milestone</th>
                <th className="px-3 py-2 text-left">Planned</th>
                <th className="px-3 py-2 text-left">Actual</th>
                <th className="px-3 py-2 text-left">Variance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const result = varianceFromApi(row) ?? variance(row.planned, row.actual);
                const toneClass =
                  result.tone === "ok"
                    ? "text-success-foreground"
                    : result.tone === "warn"
                      ? "text-warning-foreground"
                      : result.tone === "bad"
                        ? "text-danger-foreground"
                        : "text-muted-foreground";

                return (
                  <tr key={row.code} className="border-t border-border">
                    <td className="px-3 py-2.5 align-top">
                      <span className="font-semibold text-foreground">{row.code}</span>
                      <span className="text-muted-foreground"> — {row.label}</span>
                    </td>
                    <td className="px-3 py-2.5 align-top tabular-nums text-foreground">{row.planned || "—"}</td>
                    <td className="px-3 py-2.5 align-top tabular-nums text-foreground">{row.actual || "—"}</td>
                    <td className={cn("px-3 py-2.5 align-top text-sm font-medium tabular-nums", toneClass)}>{result.text}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No milestone data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Extracted ChartCards component
function ChartCards({
  studyId,
  range,
  cumulative,
  rates,
}: {
  studyId: string;
  range: StudyRange;
  cumulative: StudyOverviewContentProps["cumulative"];
  rates: StudyOverviewContentProps["rates"];
}) {
  const enrollmentRate = useStudyOverviewEnrollmentRate({
    studyId,
    timeHorizon: range,
  });
     const enrollmentCumulative = useStudyOverviewEnrollmentCumulative({
       studyId,
       timeHorizon: range,
     });
  const chartCumulative = enrollmentCumulative.cumulative;
  const chartRates = enrollmentRate.rates;

  return (
    <section className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="CUMULATIVE ENROLLMENT">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartCumulative} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="oklch(0.91 0.01 255)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} />
            <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} />
            <Tooltip />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="actual" name="Actual" stroke="oklch(0.45 0.2 263)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="forecast" name="Forecast" stroke="oklch(0.62 0.17 35)" strokeWidth={2} strokeDasharray="6 4" dot={false} />
            <Line type="monotone" dataKey="planned" name="Planned" stroke="oklch(0.55 0.12 160)" strokeWidth={2} strokeDasharray="2 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
        {enrollmentCumulative.isLoading && <p className="mt-2 text-xs text-muted-foreground">Loading cumulative enrollment data...</p>}
        {enrollmentCumulative.error && (
          <p className="mt-2 text-xs text-warning-foreground">Unable to load latest cumulative enrollment data. Showing available data.</p>
        )}
        {!enrollmentCumulative.isLoading && chartCumulative.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">No cumulative enrollment data available for the selected time horizon.</p>
        )}
      </ChartCard>

      <ChartCard title="ENROLLMENT RATE" subtitle="(per month)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartRates} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="oklch(0.91 0.01 255)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.5 0.02 260)" }} />
            <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="actual" name="Actual" radius={[2, 2, 0, 0]}>
              {chartRates.map((r, i) => (
                <Cell
                  key={i}
                  fill={r.actual < r.planned ? "oklch(0.65 0.17 25)" : "oklch(0.45 0.2 263)"}
                />
              ))}
            </Bar>
            <Bar dataKey="planned" name="Planned" fill="oklch(0.8 0.06 250)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {enrollmentRate.isLoading && <p className="mt-2 text-xs text-muted-foreground">Loading enrollment rate data...</p>}
        {enrollmentRate.error && (
          <p className="mt-2 text-xs text-warning-foreground">Unable to load latest enrollment rate data. Showing available data.</p>
        )}
        {!enrollmentRate.isLoading && chartRates.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">No enrollment rate data available for the selected time horizon.</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "oklch(0.65 0.17 25)" }} />
          Red bars indicate Actual below Planned
        </p>
      </ChartCard>
    </section>
  );
}

// Extracted BreakdownTable component
function BreakdownTable({
  studyId,
  range,
  view,
  onViewChange,
  detail,
  expanded,
  onToggle,
  onSelectPerformanceTarget,
  onSelectSiteFromCountry,
}: {
  studyId: string;
  range: StudyRange;
  view: BreakdownView;
  onViewChange: (view: BreakdownView) => void;
  detail: StudyOverviewDetail;
  expanded: ExpandedState;
  onToggle: ToggleHandler;
  onSelectPerformanceTarget: StudyOverviewContentProps["onSelectPerformanceTarget"];
  onSelectSiteFromCountry: SelectSiteHandler;
}) {
  const countryBreakdown = useStudyOverviewCountryBreakdown({
    studyId,
    timeHorizon: range,
  });
  const siteBreakdown = useStudyOverviewSiteBreakdown({
    studyId,
    timeHorizon: range,
  });

  const handlePerformanceSelect = (kind: "country" | "site", id: string) => {
    onSelectPerformanceTarget(kind, id);
  };

  return (
    <section className="mt-5">
      <PerformancePanel
        studyId={studyId}
        range={range}
        countries={countryBreakdown.countries}
        sites={siteBreakdown.sites}
        onSelect={handlePerformanceSelect}
      />

      <div className="flex items-center justify-between">
        <BreakdownViewToggle view={view} onViewChange={onViewChange} />
      </div>

      <div className="mt-3 rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {view === "country" ? "Country Breakdown" : "Site Breakdown"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          {view === "country" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3 font-medium" />
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 text-right font-medium">Target</th>
                  <th className="px-4 py-3 text-right font-medium">Actual</th>
                  <th className="px-4 py-3 text-right font-medium">% Enrolled</th>
                  <th className="px-4 py-3 text-right font-medium">Sites Active</th>
                  <th className="px-4 py-3 text-right font-medium">Avg Rate</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <CountryTable
                countries={countryBreakdown.countries}
                sites={countryBreakdown.sites}
                expanded={expanded}
                onToggle={onToggle}
                onSelectSiteFromCountry={onSelectSiteFromCountry}
              />
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3 font-medium" />
                  <th className="px-4 py-3 font-medium">Site ID</th>
                  <th className="px-4 py-3 font-medium">Site Name</th>
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 text-right font-medium">Target</th>
                  <th className="px-4 py-3 text-right font-medium">Actual</th>
                  <th className="px-4 py-3 text-right font-medium">% Enrolled</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <SiteTable sites={siteBreakdown.sites} expanded={expanded} onToggle={onToggle} />
            </table>
          )}
        </div>
        {view === "country" && countryBreakdown.isLoading && <p className="px-5 py-3 text-xs text-muted-foreground">Loading country breakdown...</p>}
        {view === "country" && countryBreakdown.error && (
          <p className="px-5 py-3 text-xs text-warning-foreground">Unable to load latest country breakdown.</p>
        )}
        {view === "site" && siteBreakdown.isLoading && <p className="px-5 py-3 text-xs text-muted-foreground">Loading site breakdown...</p>}
        {view === "site" && siteBreakdown.error && (
          <p className="px-5 py-3 text-xs text-warning-foreground">Unable to load latest site breakdown.</p>
        )}
      </div>
    </section>
  );
}

interface PerfEntry {
  key: string;
  kind: "country" | "site";
  id: string;
  name: string;
  typeLabel: string;
  meta?: string;
  delta: number;
  pctDelta: number;
  pct: number;
}

function PerformancePanel({
  studyId,
  range,
  countries,
  sites,
  onSelect,
}: {
  studyId: string;
  range: StudyRange;
  countries: StudyOverviewDetail["countries"];
  sites: SiteRow[];
  onSelect: (kind: "country" | "site", id: string) => void;
}) {
  const [pView, setPView] = React.useState<"country" | "site">("country");
  const [pShow, setPShow] = React.useState<"abs" | "pct">("abs");
  const topK = 5;

  const topUnderperforming = useStudyOverviewTopUnderperforming({
    studyId,
    timeHorizon: range,
    topK: 3,
    countryOrSite: pView,
    absoluteOrPercentage: pShow === "abs" ? "absolute" : "percentage",
  });
  const topOverperforming = useStudyOverviewTopOverperforming({
    studyId,
    timeHorizon: range,
    topK: 3,
    countryOrSite: pView,
    absoluteOrPercentage: pShow === "abs" ? "absolute" : "percentage",
    fallbackSites: sites,
  });

  const entries: PerfEntry[] =
    pView === "country"
      ? countries.map((country) => ({
          key: `c-${country.name}`,
          kind: "country" as const,
          id: country.name,
          name: country.name,
          typeLabel: "COUNTRY",
          meta: `${country.actual}/${country.target} enrolled`,
          delta: country.actual - country.target,
          pctDelta: country.pct - 100,
          pct: country.pct,
        }))
      : sites.map((site) => ({
          key: `s-${site.id}`,
          kind: "site" as const,
          id: site.id,
          name: site.name,
          typeLabel: "SITE",
          meta: `${site.country} - ${site.actual}/${site.target}`,
          delta: site.actual - site.target,
          pctDelta: site.pct - 100,
          pct: site.pct,
        }));

  const metric = (entry: PerfEntry) => (pShow === "abs" ? entry.delta : entry.pctDelta);
  const format = (value: number) =>
    pShow === "abs"
      ? `${value > 0 ? "+" : ""}${Math.round(value)} pts`
      : `${value > 0 ? "+" : ""}${Math.round(value)}%`;

  const under = [...entries]
    .sort((a, b) => metric(a) - metric(b))
    .filter((entry) => metric(entry) < 0)
    .slice(0, topK);

  const resolveSiteFromApiLabel = React.useCallback(
    (label: string): SiteRow | undefined => {
      const normalizedLabel = label.trim().toLowerCase();
      const normalizedWithoutCountry = normalizedLabel.replace(/\s*\([^)]*\)\s*$/, "");

      return sites.find((site) => {
        const siteName = site.name.trim().toLowerCase();
        const siteWithCountry = `${site.name} (${site.country})`.trim().toLowerCase();
        return siteName === normalizedWithoutCountry || siteWithCountry === normalizedLabel;
      });
    },
    [sites],
  );

  const resolveCountryFromApiLabel = React.useCallback(
    (label: string) => {
      const normalized = label.trim().toLowerCase();
      return countries.find((c) => c.name.trim().toLowerCase() === normalized);
    },
    [countries],
  );

  const apiUnder = React.useMemo(() => {
    const sourceItems =
      pShow === "abs" ? topUnderperforming.largestAbsoluteShortfall : topUnderperforming.highestPercentBelowTarget;

    return sourceItems.slice(0, topK).map((item, index) => {
      if (pView === "country") {
        const matchedCountry = resolveCountryFromApiLabel(item.site);
        const shortfall = item.shortfall ?? (matchedCountry ? Math.max(0, matchedCountry.target - matchedCountry.actual) : null);
        const belowTargetPct = item.belowTargetPct ?? (matchedCountry ? Math.max(0, 100 - matchedCountry.pct) : null);
        const pct = matchedCountry?.pct ?? (belowTargetPct == null ? 0 : Math.max(0, 100 - belowTargetPct));
        const delta = -(shortfall ?? (matchedCountry ? Math.max(0, matchedCountry.target - matchedCountry.actual) : belowTargetPct ?? 0));
        return {
          key: `api-under-${pShow}-${index}-${item.site}`,
          kind: "country" as const,
          id: item.site,
          name: item.site,
          typeLabel: "COUNTRY",
          meta: matchedCountry ? `${matchedCountry.actual}/${matchedCountry.target} enrolled` : undefined,
          delta,
          pctDelta: belowTargetPct == null ? pct - 100 : -Math.abs(belowTargetPct),
          pct,
        } satisfies PerfEntry;
      }

      const matchedSite = resolveSiteFromApiLabel(item.site);
      const countryMatch = item.site.match(/\(([^)]+)\)\s*$/);
      const country = countryMatch?.[1]?.trim() || null;
      const cleanedName = item.site.replace(/\s*\([^)]*\)\s*$/, "").trim();
      const shortfall = item.shortfall ?? (matchedSite ? Math.max(0, matchedSite.target - matchedSite.actual) : null);
      const belowTargetPct = item.belowTargetPct ?? (matchedSite ? Math.max(0, 100 - matchedSite.pct) : null);
      const pct = matchedSite?.pct ?? (belowTargetPct == null ? 0 : Math.max(0, 100 - belowTargetPct));
      const delta = -(shortfall ?? (matchedSite ? Math.max(0, matchedSite.target - matchedSite.actual) : belowTargetPct ?? 0));
      return {
        key: `api-under-${pShow}-${index}-${item.site}`,
        kind: "site" as const,
        id: matchedSite?.id ?? item.site,
        name: cleanedName || item.site,
        typeLabel: "SITE",
        meta: matchedSite
          ? `${matchedSite.country} - ${matchedSite.actual}/${matchedSite.target}`
          : country
            ? `${country} - API`
            : "API",
        delta,
        pctDelta: belowTargetPct == null ? pct - 100 : -Math.abs(belowTargetPct),
        pct,
      } satisfies PerfEntry;
    });
  }, [pShow, pView, resolveCountryFromApiLabel, resolveSiteFromApiLabel, topK, topUnderperforming.highestPercentBelowTarget, topUnderperforming.largestAbsoluteShortfall]);

  const hasApiUnderData = apiUnder.length > 0;
  const resolvedUnder = hasApiUnderData ? apiUnder : under;

  const over = [...entries]
    .sort((a, b) => metric(b) - metric(a))
    .filter((entry) => metric(entry) > 0)
    .slice(0, topK);

  const apiOver = React.useMemo(() => {
    const sourceItems =
      pShow === "abs" ? topOverperforming.largestAbsoluteSurplus : topOverperforming.highestPercentAboveTarget;

    return sourceItems.slice(0, topK).map((item, index) => {
      if (pView === "country") {
        const matchedCountry = resolveCountryFromApiLabel(item.site);
        const surplus = item.surplus ?? (matchedCountry ? Math.max(0, matchedCountry.actual - matchedCountry.target) : null);
        const aboveTargetPct = item.aboveTargetPct ?? (matchedCountry ? Math.max(0, matchedCountry.pct - 100) : null);
        const achievementPct = item.achievementPct ?? matchedCountry?.pct ?? null;
        const pct = achievementPct ?? (aboveTargetPct == null ? matchedCountry?.pct ?? 0 : 100 + aboveTargetPct);
        const delta = surplus ?? (matchedCountry ? Math.max(0, matchedCountry.actual - matchedCountry.target) : Math.abs(aboveTargetPct ?? 0));
        return {
          key: `api-over-${pShow}-${index}-${item.site}`,
          kind: "country" as const,
          id: item.site,
          name: item.site,
          typeLabel: "COUNTRY",
          meta: matchedCountry ? `${matchedCountry.actual}/${matchedCountry.target} enrolled` : undefined,
          delta,
          pctDelta: aboveTargetPct == null ? pct - 100 : Math.abs(aboveTargetPct),
          pct,
        } satisfies PerfEntry;
      }

      const matchedSite = resolveSiteFromApiLabel(item.site);
      const countryMatch = item.site.match(/\(([^)]+)\)\s*$/);
      const country = countryMatch?.[1]?.trim() || null;
      const cleanedName = item.site.replace(/\s*\([^)]*\)\s*$/, "").trim();
      const surplus = item.surplus ?? (matchedSite ? Math.max(0, matchedSite.actual - matchedSite.target) : null);
      const aboveTargetPct = item.aboveTargetPct ?? (matchedSite ? Math.max(0, matchedSite.pct - 100) : null);
      const achievementPct = item.achievementPct ?? (matchedSite ? matchedSite.pct : null);
      const pct = achievementPct ?? (aboveTargetPct == null ? matchedSite?.pct ?? 0 : 100 + aboveTargetPct);
      const delta = surplus ?? (matchedSite ? Math.max(0, matchedSite.actual - matchedSite.target) : Math.abs(aboveTargetPct ?? 0));
      return {
        key: `api-over-${pShow}-${index}-${item.site}`,
        kind: "site" as const,
        id: matchedSite?.id ?? item.site,
        name: cleanedName || item.site,
        typeLabel: "SITE",
        meta: matchedSite
          ? `${matchedSite.country} - ${matchedSite.actual}/${matchedSite.target}`
          : country
            ? `${country} - API`
            : "API",
        delta,
        pctDelta: aboveTargetPct == null ? pct - 100 : Math.abs(aboveTargetPct),
        pct,
      } satisfies PerfEntry;
    });
  }, [pShow, pView, resolveCountryFromApiLabel, resolveSiteFromApiLabel, topK, topOverperforming.highestPercentAboveTarget, topOverperforming.largestAbsoluteSurplus]);

  const hasApiOverData = apiOver.length > 0;
  const resolvedOver = hasApiOverData ? apiOver : over;

  return (
    <section className="mb-3 rounded-xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance Panel</h3>
        <div className="flex flex-wrap items-center gap-4">
          <SegGroup
            label="View"
            value={pView}
            onChange={setPView}
            options={[
              { v: "country", l: "Country" },
              { v: "site", l: "Site" },
            ]}
          />
          <SegGroup
            label="Show"
            value={pShow}
            onChange={setPShow}
            options={[
              { v: "abs", l: "Absolute" },
              { v: "pct", l: "%" },
            ]}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
        <PerfColumn tone="down" title="Underperforming" entries={resolvedUnder} format={format} metric={metric} onSelect={onSelect} />
        <PerfColumn tone="up" title="Overperforming" entries={resolvedOver} format={format} metric={metric} onSelect={onSelect} />
      </div>
      {pView === "site" && topUnderperforming.isLoading && (
        <p className="px-5 py-2 text-xs text-muted-foreground">Loading top underperforming sites...</p>
      )}
      {pView === "site" && topUnderperforming.error && (
        <p className="px-5 pb-3 text-xs text-warning-foreground">
          Unable to load top underperforming sites from API. Showing available data.
        </p>
      )}
      {pView === "site" && topOverperforming.isLoading && (
        <p className="px-5 py-2 text-xs text-muted-foreground">Loading top overperforming sites...</p>
      )}
      {pView === "site" && topOverperforming.error && (
        <p className="px-5 pb-3 text-xs text-warning-foreground">
          Unable to load top overperforming sites from API. Showing available data.
        </p>
      )}
    </section>
  );
}

function SegGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ v: T; l: string }>;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="inline-flex rounded-md bg-muted p-0.5">
        {options.map((option) => (
          <button
            key={option.v}
            type="button"
            onClick={() => onChange(option.v)}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors",
              value === option.v
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function PerfColumn({
  tone,
  title,
  entries,
  format,
  metric,
  onSelect,
}: {
  tone: "up" | "down";
  title: string;
  entries: PerfEntry[];
  format: (value: number) => string;
  metric: (entry: PerfEntry) => number;
  onSelect: (kind: "country" | "site", id: string) => void;
}) {
  const Icon = tone === "down" ? TrendingDown : TrendingUp;
  const accent =
    tone === "down"
      ? {
          dot: "bg-danger",
          text: "text-danger-foreground",
          badge: "bg-danger-bg text-danger-foreground",
          hover: "hover:bg-danger-bg/40",
        }
      : {
          dot: "bg-success",
          text: "text-success-foreground",
          badge: "bg-success-bg text-success-foreground",
          hover: "hover:bg-success-bg/40",
        };

  return (
    <div className="bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className={cn("inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider", accent.text)}>
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", accent.badge)}>{entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">No entries.</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {entries.map((entry, index) => (
            <li key={entry.key}>
              <button
                type="button"
                onClick={() => onSelect(entry.kind, entry.id)}
                className={cn("flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors", accent.hover)}
              >
                <span className="w-5 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{index + 1}</span>
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", accent.dot)} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{entry.name}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-muted-foreground">
                      {entry.typeLabel}
                    </span>
                  </span>
                  {entry.meta && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{entry.meta}</span>}
                </span>
                <span className="shrink-0 text-right">
                  <span className={cn("block text-sm font-semibold tabular-nums", accent.text)}>{format(metric(entry))}</span>
                  <span className="block text-[10px] tabular-nums text-muted-foreground">{entry.pct.toFixed(1)}%</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BreakdownViewToggle({ view, onViewChange }: { view: BreakdownView; onViewChange: (view: BreakdownView) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1">
      <button
        onClick={() => onViewChange("country")}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          view === "country" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        By Country
      </button>
      <button
        onClick={() => onViewChange("site")}
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
  countries,
  sites,
  expanded,
  onToggle,
  onSelectSiteFromCountry,
}: {
  countries: StudyOverviewDetail["countries"];
  sites: SiteRow[];
  expanded: ExpandedState;
  onToggle: ToggleHandler;
  onSelectSiteFromCountry: SelectSiteHandler;
}) {
  return (
    <tbody>
      {countries.map((c) => {
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
              id={`country-row-${c.name}`}
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
                    sites={sites.filter((s) => s.country === c.name)}
                    onSelectSite={onSelectSiteFromCountry}
                  />
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}
      {countries.length === 0 && (
        <tr>
          <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
            No breakdown data available.
          </td>
        </tr>
      )}
    </tbody>
  );
}

function SiteTable({
  sites,
  expanded,
  onToggle,
}: {
  sites: SiteRow[];
  expanded: ExpandedState;
  onToggle: ToggleHandler;
}) {
  return (
    <tbody>
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
    </tbody>
  );
}
