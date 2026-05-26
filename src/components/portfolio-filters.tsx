import { useMemo, useState } from "react";
import { Search, Calendar, ChevronDown, Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Study } from "@/lib/data";
import { filterStudies } from "@/lib/filter-studies";
import { getStudyRegions, REGIONS } from "@/lib/study-derived";
import { cn } from "@/lib/utils";

const phaseOrder = ["Ph I", "Ph II", "Ph III", "Ph IV"];

function uniqSorted<T>(arr: T[], order?: T[]): T[] {
  const s = Array.from(new Set(arr));
  if (order) {
    return s.sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai === -1 && bi === -1) return String(a).localeCompare(String(b));
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }
  return s.sort((a, b) => String(a).localeCompare(String(b)));
}


export interface FilterState {
  search: string;
  areas: string[];
  phase: string | null;
  status: string | null;
  portfolio: string | null;
  program: string | null;
  region: string | null;
  fpiFrom: string | null;
  fpiTo: string | null;
  lpoFrom: string | null;
  lpoTo: string | null;
}

export const emptyFilters: FilterState = {
  search: "",
  areas: [],
  phase: null,
  status: null,
  portfolio: null,
  program: null,
  region: null,
  fpiFrom: null,
  fpiTo: null,
  lpoFrom: null,
  lpoTo: null,
};

function SingleSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v === "__all__" ? null : v)}>
      <SelectTrigger className="h-9 w-auto gap-1.5 rounded-lg border border-input bg-card px-3 text-sm">
        <SelectValue placeholder={label}>
          {value ? (
            <span>
              <span className="text-muted-foreground">{label}:</span>{" "}
              <span className="font-medium">{value}</span>
            </span>
          ) : (
            label
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MultiSelectTA({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (a: string) =>
    onChange(selected.includes(a) ? selected.filter((s) => s !== a) : [...selected, a]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-card px-3 text-sm text-foreground hover:bg-muted">
          <span className="text-muted-foreground">Therapeutic Area</span>
          {selected.length > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="mb-1 flex items-center justify-between px-1 pb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {selected.length} selected
          </span>
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {options.map((a: string) => {
            const isSel = selected.includes(a);
            return (
              <button
                key={a}
                onClick={() => toggle(a)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    isSel ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {isSel && <Check className="h-3 w-3" />}
                </span>
                {a}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const TODAY = new Date(2026, 4, 20);

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

const FPI_PRESETS: { label: string; range: () => [string, string] }[] = [
  { label: "Last 6 Months", range: () => [fmt(addMonths(TODAY, -6)), fmt(TODAY)] },
  { label: "Last 12 Months", range: () => [fmt(addMonths(TODAY, -12)), fmt(TODAY)] },
  { label: "Year to Date", range: () => [fmt(new Date(TODAY.getFullYear(), 0, 1)), fmt(TODAY)] },
];

const LPO_PRESETS: { label: string; range: () => [string, string] }[] = [
  { label: "Next 6 Months", range: () => [fmt(TODAY), fmt(addMonths(TODAY, 6))] },
  { label: "Next 12 Months", range: () => [fmt(TODAY), fmt(addMonths(TODAY, 12))] },
  { label: "Year to Date", range: () => [fmt(TODAY), fmt(new Date(TODAY.getFullYear(), 11, 31))] },
];

function presetActive(from: string | null, to: string | null, preset: [string, string]): boolean {
  return from === preset[0] && to === preset[1];
}

function DateSection({
  title,
  presets,
  from,
  to,
  onChange,
}: {
  title: string;
  presets: { label: string; range: () => [string, string] }[];
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const range = p.range();
          const active = presetActive(from, to, range);
          return (
            <button
              key={p.label}
              onClick={() => onChange(active ? null : range[0], active ? null : range[1])}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs transition",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-card text-foreground hover:bg-muted",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <label className="space-y-1">
          <span className="block text-[11px] text-muted-foreground">From</span>
          <input
            type="date"
            value={from ?? ""}
            onChange={(e) => onChange(e.target.value || null, to)}
            className="h-8 w-full rounded-md border border-input bg-card px-2 text-xs focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[11px] text-muted-foreground">To</span>
          <input
            type="date"
            value={to ?? ""}
            onChange={(e) => onChange(from, e.target.value || null)}
            className="h-8 w-full rounded-md border border-input bg-card px-2 text-xs focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </label>
      </div>
    </div>
  );
}

function FpiLpoFilter({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  const active =
    !!(filters.fpiFrom || filters.fpiTo || filters.lpoFrom || filters.lpoTo);
  const count =
    (filters.fpiFrom || filters.fpiTo ? 1 : 0) +
    (filters.lpoFrom || filters.lpoTo ? 1 : 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-card px-3 text-sm",
            active && "border-primary/40",
          )}
        >
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={active ? "font-medium" : "text-foreground"}>FPI / LPO</span>
          {count > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
              {count}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Date Filters</p>
          {active && (
            <button
              onClick={() =>
                onChange({ ...filters, fpiFrom: null, fpiTo: null, lpoFrom: null, lpoTo: null })
              }
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <DateSection
          title="First Patient In (FPI)"
          presets={FPI_PRESETS}
          from={filters.fpiFrom}
          to={filters.fpiTo}
          onChange={(from, to) => onChange({ ...filters, fpiFrom: from, fpiTo: to })}
        />
        <DateSection
          title="Last Patient Out (LPO)"
          presets={LPO_PRESETS}
          from={filters.lpoFrom}
          to={filters.lpoTo}
          onChange={(from, to) => onChange({ ...filters, lpoFrom: from, lpoTo: to })}
        />
        <p className="text-[11px] text-muted-foreground">
          Leave either end blank to apply an open-ended filter.
        </p>
      </PopoverContent>
    </Popover>
  );
}


export function PortfolioFilters({
  studies,
  total,
  shown,
  filters,
  onChange,
}: {
  studies: Study[];
  total: number;
  shown: number;
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  const available = useMemo(() => {
    const opts = (key: keyof FilterState, pick: (s: Study) => string, order?: string[]) =>
      uniqSorted(filterStudies(studies, filters, key).map(pick), order);
    const regionPool = new Set<string>();
    for (const s of filterStudies(studies, filters, "region")) {
      for (const r of getStudyRegions(s)) regionPool.add(r);
    }
    return {
      areas: opts("areas", (s) => s.therapeuticArea),
      phases: opts("phase", (s) => s.phase, phaseOrder),
      statuses: opts("status", (s) => s.status),
      portfolios: opts("portfolio", (s) => s.portfolio),
      programs: opts("program", (s) => s.program),
      regions: REGIONS.filter((r) => regionPool.has(r)),
    };
  }, [studies, filters]);



  const hasAny =
    filters.areas.length > 0 ||
    filters.phase ||
    filters.status ||
    filters.portfolio ||
    filters.program ||
    filters.region ||
    filters.fpiFrom || filters.fpiTo || filters.lpoFrom || filters.lpoTo ||
    filters.search.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Search by ID, title, indication..."
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{shown}</span> of{" "}
          <span className="font-semibold text-foreground">{total}</span> studies
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectTA options={available.areas} selected={filters.areas} onChange={(v) => set("areas", v)} />
        <SingleSelect label="Phase" options={available.phases} value={filters.phase} onChange={(v) => set("phase", v)} />
        <SingleSelect label="Study Status" options={available.statuses} value={filters.status} onChange={(v) => set("status", v)} />
        <SingleSelect
          label="Portfolio"
          options={available.portfolios}
          value={filters.portfolio}
          onChange={(v) => set("portfolio", v)}
        />
        <SingleSelect label="Program" options={available.programs} value={filters.program} onChange={(v) => set("program", v)} />
        <SingleSelect label="Region" options={available.regions} value={filters.region} onChange={(v) => set("region", v)} />
        <FpiLpoFilter filters={filters} onChange={onChange} />
        {hasAny && (
          <button
            onClick={() => onChange(emptyFilters)}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>
      {filters.areas.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.areas.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1 rounded-full border border-input bg-card px-2 py-0.5 text-xs text-foreground"
            >
              {a}
              <button
                onClick={() => set("areas", filters.areas.filter((x) => x !== a))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
