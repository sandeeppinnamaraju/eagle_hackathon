import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProtocolResult } from "@/lib/data";
import type { SearchMode } from "@/components/protocol-search/types";

export function ProtocolSearchPageShell({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return <main className={cn("mx-auto max-w-5xl px-6", compact ? "py-8" : "py-10")}>{children}</main>;
}

export function ProtocolSearchModeLink({
  mode,
  id,
  children,
  className,
}: {
  mode: SearchMode;
  id?: string;
  children: ReactNode;
  className: string;
}) {
  return (
    <Link
      to="/protocol-search"
      search={{ mode, ...(id ? { id } : {}) }}
      className={className}
    >
      {children}
    </Link>
  );
}

export function FieldLabel({
  children,
  icon,
  required,
  optional,
}: {
  children: ReactNode;
  icon?: ReactNode;
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

export function StatChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card/80 px-3 py-1 text-xs font-medium text-accent-foreground backdrop-blur">
      {icon}
      {label}
    </span>
  );
}

export function matchTier(pct: number): "high" | "moderate" | "low" {
  if (pct >= 70) return "high";
  if (pct >= 40) return "moderate";
  return "low";
}

export function tierStyles(t: "high" | "moderate" | "low") {
  if (t === "high") {
    return {
      border: "border-l-success",
      pill: "bg-success-bg text-success-foreground",
      label: "High match",
    };
  }

  if (t === "moderate") {
    return {
      border: "border-l-warning",
      pill: "bg-warning-bg text-warning-foreground",
      label: "Moderate match",
    };
  }

  return {
    border: "border-l-muted-foreground/40",
    pill: "bg-muted text-muted-foreground",
    label: "Low match",
  };
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-sm", color)} />
      {label}
    </span>
  );
}

export function RatioIndicator({ ratioPct }: { ratioPct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            ratioPct >= 70 ? "bg-success" : ratioPct >= 40 ? "bg-warning" : "bg-danger",
          )}
          style={{ width: `${ratioPct}%` }}
        />
      </div>
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          ratioPct >= 70
            ? "text-success-foreground"
            : ratioPct >= 40
              ? "text-warning-foreground"
              : "text-danger-foreground",
        )}
      >
        {ratioPct}%
      </span>
    </div>
  );
}

export function OptionalCellText({
  value,
  className = "text-xs text-foreground",
}: {
  value: string | null;
  className?: string;
}) {
  if (!value) {
    return <span className="text-xs text-muted-foreground/60">-</span>;
  }

  return <span className={className}>{value}</span>;
}

export function CriteriaPanel({
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

export function ExplainMatch({ r }: { r: ProtocolResult }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(timer);
  }, []);

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

export function MetaCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
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

export function CriteriaBlock({
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

export function Stat({
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

export function InsightCard({
  tone,
  icon,
  title,
  body,
}: {
  tone: "risk" | "reco" | "trend";
  icon: ReactNode;
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
