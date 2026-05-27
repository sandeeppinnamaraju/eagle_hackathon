import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { HomeRouteTile } from "@/components/home/home-route-types";

interface HomeRouteTileCardProps {
  tile: HomeRouteTile;
}

export function HomeRouteTileCard({ tile }: HomeRouteTileCardProps) {
  const Icon = tile.icon;

  return (
    <Link
      to={tile.to}
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-xl font-bold text-foreground">{tile.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tile.description}</p>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        Open
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
