import { Link } from "@tanstack/react-router";
import type { Study } from "@/lib/data";
import { PriorityBadge, PerformanceBadge } from "./badges";
import { Sparkline } from "./sparkline";
import { Globe, Building2 } from "lucide-react";

function ProgressBar({ pct, performance }: { pct: number; performance: Study["performance"] }) {
  const color =
    performance === "On Track"
      ? "bg-success"
      : performance === "At Risk"
      ? "bg-warning"
      : performance === "Off Track"
      ? "bg-danger"
      : "bg-muted-foreground/40";
  const trackColor =
    performance === "On Track"
      ? "bg-success-bg"
      : performance === "At Risk"
      ? "bg-warning-bg"
      : performance === "Off Track"
      ? "bg-danger-bg"
      : "bg-muted";
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${trackColor}`}>
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

export function StudyCardGrid({ studies }: { studies: Study[] }) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
      {studies.map((s) => {
        const pct = s.target ? Math.round((s.actual / s.target) * 100 * 10) / 10 : 0;
        return (
          <Link
            key={s.id}
            to="/studies/$studyId"
            params={{ studyId: s.id }}
            className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-primary">{s.id}</span>
                <span className="text-xs text-muted-foreground">{s.phase}</span>
                <PriorityBadge value={s.priority} />
              </div>
              <PerformanceBadge value={s.performance} />
            </div>

            <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
              {s.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.indication} · {s.therapeuticArea}
            </p>
            <p className="mt-0.5 font-mono text-xs font-semibold text-primary">{s.program}</p>

            <div className="mt-4">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{s.actual.toLocaleString()}</span> enrolled
                </span>
                <span className="font-semibold text-foreground">
                  {s.percentVsPlan != null ? `${s.percentVsPlan}%` : "—"}
                </span>
                <span className="text-muted-foreground">of {s.target.toLocaleString()}</span>
              </div>
              <div className="mt-1.5">
                <ProgressBar pct={pct} performance={s.performance} />
              </div>
            </div>

            <div className="mt-4 flex flex-1 items-end justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground">6-month trend</p>
                <Sparkline
                  data={s.trend}
                  stroke="oklch(0.52 0.19 263)"
                  className="mt-1 h-8 w-24"
                  width={96}
                  height={32}
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {s.countries} countries
                </span>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {s.sites} sites
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="mt-0.5 font-medium text-foreground">{s.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Portfolio</p>
                <p className="mt-0.5 font-medium text-foreground">{s.portfolio}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
