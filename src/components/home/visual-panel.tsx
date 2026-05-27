import { HOME_PORTFOLIO_PROGRESS, type HomeProgressItem } from "@/components/home/data";

function progressToneClass(tone: HomeProgressItem["tone"]): string {
  if (tone === "success") return "bg-success";
  if (tone === "warning") return "bg-warning";
  return "bg-primary";
}

export function VisualPanel() {
  return (
    <div className="relative hidden lg:block">
      <div className="relative rounded-2xl border border-border bg-card/80 p-6 shadow-card backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Portfolio Health</p>
            <p className="mt-1 text-2xl font-bold text-foreground">On Track</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Live
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {HOME_PORTFOLIO_PROGRESS.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold text-foreground">{row.value}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${progressToneClass(row.tone)}`}
                  style={{ width: `${row.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-info opacity-20 blur-xl" />
    </div>
  );
}