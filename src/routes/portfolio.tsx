import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { KpiCard } from "@/components/kpi-card";
import { PortfolioFilters, emptyFilters, type FilterState } from "@/components/portfolio-filters";
import { InsightsButton } from "@/components/insights-button";
import { ViewToggle } from "@/components/view-toggle";
import { StudyTable } from "@/components/study-table";
import { StudyCardGrid } from "@/components/study-card-grid";
import { studies } from "@/lib/data";
import { filterStudies } from "@/lib/filter-studies";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Study Portfolio Dashboard — Flight Deck" },
      { name: "description", content: "Overview of active clinical trial portfolios, enrollment, and performance." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const [view, setView] = useState<"table" | "cards">("cards");
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const filtered = useMemo(() => filterStudies(studies, filters), [filters]);

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Study Portfolio Dashboard
        </h1>
        <InsightsButton />
      </div>

      <div className="mt-5">
        <PortfolioFilters
          studies={studies}
          total={studies.length}
          shown={filtered.length}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Active Studies" value="30" sub="recruiting or follow-up" accent="primary" />
        <KpiCard label="On Track" value="26.7%" sub="8 of 30 active" accent="success" />
        <KpiCard label="At Risk / Off Track" value="73.3%" sub="22 of 30 active" accent="warning" />
        <KpiCard
          label="Enrollment vs Target"
          value="14.4%"
          sub="12,932 of 89,802 patients"
          accent="info"
          spark={[2, 4, 5, 8, 11, 14]}
        />
        <KpiCard label="Enrollment vs Plan (To Date)" value="90.1%" sub="12,416 of 13,782 planned" accent="violet" />
        <KpiCard label="Velocity vs Plan" value="62.5%" sub="avg enrollment speed" accent="teal" />
      </div>

      <div className="mt-5 flex justify-end">
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="mt-3">
        {view === "table" ? (
          <StudyTable studies={filtered} />
        ) : (
          <StudyCardGrid studies={filtered.slice(0, 9)} />
        )}
      </div>
    </main>
  );
}
