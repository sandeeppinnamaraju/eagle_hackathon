import { FlaskConical } from "lucide-react";

export function HomeRouteHeader() {
  return (
    <>
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <FlaskConical className="h-3.5 w-3.5" />
        Flight Deck
      </span>
      <h1 className="mt-5 text-center text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Welcome to{" "}
        <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">Flight Deck</span>
      </h1>
      <p className="mt-4 max-w-2xl text-center text-base text-muted-foreground lg:text-lg">
        The operating cockpit for clinical operations. Pick where you want to go next.
      </p>
    </>
  );
}
