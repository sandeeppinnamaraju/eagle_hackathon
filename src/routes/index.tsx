import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, Search, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flight Deck — Clinical Trials Intelligence" },
      { name: "description", content: "Pilot every protocol with confidence. Real-time visibility across your entire clinical portfolio." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-gradient-to-br from-background via-background to-accent/30">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[520px] w-[520px] rounded-full bg-info/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-success/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1600px] flex-col px-6 py-10 lg:py-16">
        {/* Hero */}
        <section className="grid flex-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome to Flight Deck
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Pilot every protocol with{" "}
              <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                precision
              </span>{" "}
              — from first patient in to final readout.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:text-lg">
              Unified clinical trial intelligence that turns enrollment signals,
              site performance, and protocol risk into the decisions that move
              medicine forward.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/portfolio"
                className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-all hover:bg-primary/90 hover:shadow-card-hover"
              >
                <LayoutGrid className="h-4 w-4" />
                Open Study Portfolio
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/protocol-search"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Search className="h-4 w-4" />
                Protocol Search
              </Link>
            </div>

            {/* Stat strip */}
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-6">
              {[
                { label: "Active studies", value: "120+" },
                { label: "Countries", value: "45" },
                { label: "Sites monitored", value: "2.4k" },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</dt>
                  <dd className="mt-1 text-2xl font-bold text-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Visual panel */}
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
                {[
                  { label: "Enrollment vs plan", value: 92, tone: "success" },
                  { label: "Sites activated", value: 78, tone: "primary" },
                  { label: "Protocol deviations", value: 14, tone: "warning" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-semibold text-foreground">{row.value}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={
                          "h-full rounded-full " +
                          (row.tone === "success"
                            ? "bg-success"
                            : row.tone === "warning"
                              ? "bg-warning"
                              : "bg-primary")
                        }
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Floating accent */}
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-info opacity-20 blur-xl" />
          </div>
        </section>

        {/* Footer caption */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Built for clinical operations teams who move at the speed of science.
        </p>
      </div>
    </main>
  );
}
