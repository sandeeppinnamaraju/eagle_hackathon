import { useState, useRef, useEffect } from "react";
import { Lightbulb, TrendingDown, AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { useStudyOverviewInsights } from "@/hooks/use-study-overview-insights";
import type { InsightTone, StudyOverviewInsight } from "@/lib/study-overview-insights-service";

const fallbackInsights: StudyOverviewInsight[] = [
  { type: "danger", text: "10 of 21 active studies are off-track and require immediate attention." },
  { type: "warning", text: "7 studies are at risk — early intervention can prevent escalation." },
  { type: "success", text: "Immunology leads at 89% enrollment vs plan." },
  { type: "info", text: "Portfolio is 76,870 patients behind total enrollment target." },
  { type: "warning", text: "4 high-priority studies below plan — escalate for review." },
];

const toneIcons: Record<InsightTone, LucideIcon> = {
  danger: TrendingDown,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const toneStyles: Record<InsightTone, { bg: string; icon: string; text: string }> = {
  danger: { bg: "bg-danger-bg/60", icon: "text-danger", text: "text-danger-foreground" },
  warning: { bg: "bg-warning-bg/70", icon: "text-warning-foreground", text: "text-warning-foreground" },
  success: { bg: "bg-success-bg/60", icon: "text-success", text: "text-success-foreground" },
  info: { bg: "bg-info-bg/60", icon: "text-info", text: "text-info-foreground" },
};

export function InsightsButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { insights, isLoading, error, loadInsights } = useStudyOverviewInsights(fallbackInsights);

  const insightsCount = insights.length;

  function handleToggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      void loadInsights();
    }
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggleOpen}
        className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.85_0.1_85)] bg-warning-bg/40 px-3.5 py-1.5 text-sm font-medium text-warning-foreground transition-colors hover:bg-warning-bg/70"
      >
        <Lightbulb className="h-4 w-4" />
        {insightsCount} Insights
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[420px] rounded-xl border border-border bg-popover p-4 shadow-popover">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Portfolio Insights
          </p>
          {isLoading && (
            <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Loading insights...
            </p>
          )}

          {!isLoading && insights.length === 0 && (
            <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              No insights available.
            </p>
          )}

          {!isLoading && insights.length > 0 && (
            <div className="space-y-2">
              {insights.map((ins, i) => {
                const Icon = toneIcons[ins.type];
                const s = toneStyles[ins.type];
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-lg p-3 ${s.bg}`}
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.icon}`} />
                    <p className={`text-sm leading-snug ${s.text}`}>{ins.text}</p>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-muted-foreground">
              Could not refresh insights right now. Showing available insights.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
