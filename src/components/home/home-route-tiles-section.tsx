import type { HomeRouteTile } from "@/components/home/home-route-types";
import { HomeRouteTileCard } from "@/components/home/home-route-tile-card";

interface HomeRouteTilesSectionProps {
  tiles: readonly HomeRouteTile[];
}

export function HomeRouteTilesSection({ tiles }: HomeRouteTilesSectionProps) {
  return (
    <section className="mt-12 grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
      {tiles.map((tile) => (
        <HomeRouteTileCard key={tile.to} tile={tile} />
      ))}
    </section>
  );
}
