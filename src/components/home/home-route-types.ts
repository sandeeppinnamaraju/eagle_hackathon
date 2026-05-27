import type { LucideIcon } from "lucide-react";

export type HomeRouteTileDestination = "/portfolio" | "/protocol-search";

export interface HomeRouteTile {
  to: HomeRouteTileDestination;
  title: string;
  description: string;
  icon: LucideIcon;
}
