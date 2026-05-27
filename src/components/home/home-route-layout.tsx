import type { ReactNode } from "react";

interface HomeRouteLayoutProps {
  children: ReactNode;
}

export function HomeRouteLayout({ children }: HomeRouteLayoutProps) {
  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-gradient-to-br from-background via-background to-accent/30">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[520px] w-[520px] rounded-full bg-info/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-[1100px] flex-col items-center px-6 py-16 lg:py-24">{children}</div>
    </main>
  );
}
