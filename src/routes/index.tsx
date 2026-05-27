import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home/home-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flight Deck — Clinical Trials Intelligence" },
      { name: "description", content: "Pilot every protocol with confidence. Real-time visibility across your entire clinical portfolio." },
    ],
  }),
  component: HomePage,
});
