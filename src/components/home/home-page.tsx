import { AmbientBackground } from "@/components/home/ambient-background";
import { HeroContent } from "@/components/home/hero-content";
import { VisualPanel } from "@/components/home/visual-panel";

export function HomePage() {
  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-gradient-to-br from-background via-background to-accent/30">
      <AmbientBackground />

      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1600px] flex-col px-6 py-10 lg:py-16">
        <section className="grid flex-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <HeroContent />
          <VisualPanel />
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Built for clinical operations teams who move at the speed of science.
        </p>
      </div>
    </main>
  );
}