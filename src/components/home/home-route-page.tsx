import { LayoutGrid, Search } from "lucide-react";
import { HomeRouteHeader } from "@/components/home/home-route-header";
import { HomeRouteLayout } from "@/components/home/home-route-layout";
import { HomeRouteTilesSection } from "@/components/home/home-route-tiles-section";
import type { HomeRouteTile } from "@/components/home/home-route-types";

const HOME_ROUTE_TILES: readonly HomeRouteTile[] = [
  {
    to: "/portfolio",
    title: "Study Portfolio",
    description:
      "Browse every active and planned study with live enrollment, site coverage, and performance signals in one place.",
    icon: LayoutGrid,
  },
  {
    to: "/protocol-search",
    title: "Protocol Search",
    description:
      "Search across protocols to find precedents, eligibility patterns, and design intelligence for your next study.",
    icon: Search,
  },
];

export function HomeRoutePage() {
  return (
    <HomeRouteLayout>
      <HomeRouteHeader />
      <HomeRouteTilesSection tiles={HOME_ROUTE_TILES} />
    </HomeRouteLayout>
  );
}
