import { createFileRoute } from "@tanstack/react-router";
import { HomeRoutePage } from "@/components/home/home-route-page";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Flight Deck — Home" },
      { name: "description", content: "Flight Deck — the operating cockpit for clinical operations." },
    ],
  }),
  component: HomeRoutePage,
});
