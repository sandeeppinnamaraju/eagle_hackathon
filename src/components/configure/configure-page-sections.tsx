import { AlertTriangle, Info, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

interface ConfigurePageLayoutProps {
  children: ReactNode;
}

interface ConfigurePageHeaderProps {
  title: string;
  description: ReactNode;
}

interface NumberPercentInputProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}

interface ReadonlyPercentInputProps {
  value: string | number;
  className?: string;
}

interface OnTrackThresholdSectionProps {
  onTrack: number;
  safeOnTrack: number;
  onTrackChanged: (value: number) => void;
}

interface AtRiskThresholdSectionProps {
  atRiskFrom: number;
  safeAtRiskFrom: number;
  safeOnTrack: number;
  atRiskFromChanged: (value: number) => void;
}

interface OffTrackThresholdSectionProps {
  offTrackMax: number;
}

interface ThresholdBandPreviewProps {
  safeOnTrack: number;
  safeAtRiskFrom: number;
  offTrackMax: number;
}

interface SaveConfigurationButtonProps {
  saving: boolean;
  onSave: () => void;
}

export function ConfigurePageLayout({ children }: ConfigurePageLayoutProps) {
  return <main className="mx-auto max-w-[1600px] px-6 py-8">{children}</main>;
}

export function ConfigurePageHeader({ title, description }: ConfigurePageHeaderProps) {
  return (
    <header>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

export function ConfigureInfoBanner() {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-lg border border-info/30 bg-info-bg/60 px-4 py-3 text-sm text-info-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        Thresholds apply globally. Changes will affect the performance status badge on every study, country, and
        site view.
      </p>
    </div>
  );
}

function NumberPercentInput({ value, min, max, onChange, className }: NumberPercentInputProps) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={className}
      />
      <span className="text-sm text-muted-foreground">%</span>
    </div>
  );
}

function ReadonlyPercentInput({ value, className }: ReadonlyPercentInputProps) {
  return (
    <div className="mt-1 flex items-center gap-1.5">
      <input type="text" readOnly value={value} className={className} />
      <span className="text-sm text-muted-foreground">%</span>
    </div>
  );
}

export function OnTrackThresholdSection({
  onTrack,
  safeOnTrack,
  onTrackChanged,
}: OnTrackThresholdSectionProps) {
  return (
    <section className="rounded-xl border border-success/40 bg-success-bg/40 p-5 shadow-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold text-success-foreground">
        <TrendingUp className="h-3.5 w-3.5" /> On Track
      </span>
      <p className="mt-3 text-sm text-muted-foreground">
        A study is <span className="font-semibold text-foreground">On Track</span> when its cumulative enrollment
        meets or exceeds the scheduled plan.
      </p>
      <div className="mt-5 flex items-end gap-3">
        <span className="pb-2 text-sm text-muted-foreground">More than</span>
        <div className="flex-1">
          <label className="block text-center text-xs font-medium text-muted-foreground">Minimum threshold</label>
          <NumberPercentInput
            value={onTrack}
            min={1}
            max={100}
            onChange={onTrackChanged}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-center text-base font-semibold text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-success-foreground">Enrollment vs Plan ≥ {safeOnTrack}%</p>
    </section>
  );
}

export function AtRiskThresholdSection({
  atRiskFrom,
  safeAtRiskFrom,
  safeOnTrack,
  atRiskFromChanged,
}: AtRiskThresholdSectionProps) {
  return (
    <section className="rounded-xl border border-warning/40 bg-warning-bg/40 p-5 shadow-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning-foreground">
        <AlertTriangle className="h-3.5 w-3.5" /> At Risk
      </span>
      <p className="mt-3 text-sm text-muted-foreground">
        A study is <span className="font-semibold text-foreground">At Risk</span> when enrollment is below plan but
        within an acceptable tolerance.
      </p>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground">From</label>
          <div className="mt-1 flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={safeOnTrack - 1}
              value={atRiskFrom}
              onChange={(event) => atRiskFromChanged(Number(event.target.value))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-center text-base font-semibold text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <span className="pb-2.5 text-sm text-muted-foreground">to</span>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">To (auto)</label>
          <ReadonlyPercentInput
            value={`<${safeOnTrack}`}
            className="h-10 w-full rounded-md border border-dashed border-input bg-muted px-3 text-center text-sm font-semibold text-muted-foreground"
          />
          <p className="mt-1 text-center text-[11px] text-muted-foreground">Derived from On Track</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-warning-foreground">
        Enrollment vs Plan ≥{safeAtRiskFrom}% and &lt;{safeOnTrack}%
      </p>
    </section>
  );
}

export function OffTrackThresholdSection({ offTrackMax }: OffTrackThresholdSectionProps) {
  return (
    <section className="rounded-xl border border-destructive/30 bg-danger-bg/40 p-5 shadow-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-bg px-2.5 py-1 text-xs font-semibold text-danger-foreground">
        <TrendingDown className="h-3.5 w-3.5" /> Off Track
      </span>
      <p className="mt-3 text-sm text-muted-foreground">
        A study is <span className="font-semibold text-foreground">Off Track</span> when enrollment has fallen
        significantly behind the planned schedule.
      </p>
      <div className="mt-5 flex items-end gap-3">
        <span className="pb-2 text-sm text-muted-foreground">Less than</span>
        <div className="flex-1">
          <label className="block text-center text-xs font-medium text-muted-foreground">Threshold (auto)</label>
          <ReadonlyPercentInput
            value={offTrackMax}
            className="h-10 w-full rounded-md border border-dashed border-input bg-muted px-3 text-center text-base font-semibold text-muted-foreground"
          />
          <p className="mt-1 text-center text-[11px] text-muted-foreground">Matches At Risk from</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-danger-foreground">Enrollment vs Plan &lt; {offTrackMax}%</p>
    </section>
  );
}

export function ThresholdBandPreview({
  safeOnTrack,
  safeAtRiskFrom,
  offTrackMax,
}: ThresholdBandPreviewProps) {
  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Threshold Band Preview</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Live preview of how the 0–100% enrollment range is divided by the current settings.
      </p>
      <div className="mt-4">
        <div className="relative flex h-6 w-full overflow-hidden rounded-full ring-1 ring-border">
          <div className="h-full bg-[oklch(0.7_0.15_25)]" style={{ width: `${offTrackMax}%` }} />
          <div
            className="h-full bg-[oklch(0.82_0.16_85)]"
            style={{ width: `${Math.max(0, safeOnTrack - offTrackMax)}%` }}
          />
          <div
            className="h-full bg-[oklch(0.68_0.15_150)]"
            style={{ width: `${Math.max(0, 100 - safeOnTrack)}%` }}
          />
        </div>
        <div className="relative mt-2 h-4 text-[11px] text-muted-foreground">
          <span className="absolute left-0">0%</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${offTrackMax}%` }}>
            {offTrackMax}%
          </span>
          <span className="absolute -translate-x-1/2" style={{ left: `${safeOnTrack}%` }}>
            {safeOnTrack}%
          </span>
          <span className="absolute right-0">100%</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.7_0.15_25)]" />
          Off Track (&lt;{offTrackMax}%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.82_0.16_85)]" />
          At Risk (≥{safeAtRiskFrom}% and &lt;{safeOnTrack}%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.68_0.15_150)]" />
          On Track (≥{safeOnTrack}%)
        </span>
      </div>
    </section>
  );
}

export function SaveConfigurationButton({ saving, onSave }: SaveConfigurationButtonProps) {
  return (
    <div className="mt-6 flex justify-end">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save configuration"}
      </button>
    </div>
  );
}
