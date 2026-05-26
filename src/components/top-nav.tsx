import { Link, useLocation } from "@tanstack/react-router";
import { Home, LayoutGrid, Search, type LucideIcon } from "lucide-react";

const tabs: { to: "/" | "/portfolio" | "/protocol-search"; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/portfolio", label: "Study Portfolio", icon: LayoutGrid },
  { to: "/protocol-search", label: "Protocol Search", icon: Search },
];

export function TopNav() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-30 w-full bg-nav text-nav-foreground shadow-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-8 px-6">
        <Link to="/" className="text-lg font-bold tracking-tight">
          Flight Deck
        </Link>
        <nav className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white")
                }
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/20 ring-1 ring-white/30" />
        </div>
      </div>
    </header>
  );
}
