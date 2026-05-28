import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, LayoutGrid, Search, Settings, LogOut, type LucideIcon } from "lucide-react";
import { clearSession, getSession, type SessionUser } from "@/lib/auth";

const tabs: { to: "/home" | "/portfolio" | "/protocol-search" | "/configure"; label: string; icon: LucideIcon }[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/portfolio", label: "Study Portfolio", icon: LayoutGrid },
  { to: "/protocol-search", label: "Protocol Search", icon: Search },
  { to: "/configure", label: "Configure", icon: Settings },
];

export function TopNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionUser | null>(null);
  useEffect(() => { setSession(getSession()); }, [pathname]);

  const visibleTabs =
    session?.role === "ADMIN" ? tabs : tabs.filter((tab) => tab.to !== "/configure");

  function handleSignOut() {
    clearSession();
    navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-nav text-nav-foreground shadow-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-8 px-6">
        <Link to="/home" className="text-lg font-bold tracking-tight">
          Flight Deck
        </Link>
        <nav className="flex items-center gap-1">
          {visibleTabs.map((t) => {
            const active = pathname === t.to || pathname.startsWith(t.to + "/");
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
          {session && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              {session.role}
            </span>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold uppercase ring-1 ring-white/30">
              {session ? session.username.slice(0, 2) : "??"}
            </div>
            {session && (
              <span className="hidden text-sm font-medium text-white/90 sm:inline">
                {session.username.charAt(0).toUpperCase() + session.username.slice(1)} User
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
