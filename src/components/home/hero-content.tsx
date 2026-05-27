import { Link } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid, Search, Sparkles } from "lucide-react";
import { HOME_STATS } from "@/components/home/data";

export function HeroContent() {
  return (
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

      <HeroActions />
      <HeroStatStrip />
    </div>
  );
}

function HeroActions() {
  return (
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
  );
}

function HeroStatStrip() {
  return (
    <dl className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-6">
      {HOME_STATS.map((stat) => (
        <div key={stat.label}>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</dt>
          <dd className="mt-1 text-2xl font-bold text-foreground">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}