import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { KpiCard } from "@/components/kpi-card";
import { PortfolioFilters } from "@/components/portfolio-filters";
import { InsightsButton } from "@/components/insights-button";
import { ViewToggle } from "@/components/view-toggle";
import { StudyTable } from "@/components/study-table";
import { StudyCardGrid } from "@/components/study-card-grid";
import { DataStateBanner } from "@/components/data-state-banner";
import { useIncrementalList } from "../hooks/use-incremental-list";
import { useStudyFilters } from "@/hooks/use-study-filters";
import { useStudiesData } from "../hooks/use-studies-data";
import { sortStudies, type StudySortDirection, type StudySortKey } from "@/lib/study-sorting";
import { studies as fallbackStudies } from "@/lib/data";

const INITIAL_ROWS = 25;
const LOAD_MORE_ROWS = 25;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portfolio Dashboard — Flight Deck" },
      {
        name: "description",
        content: "Overview of active clinical trial portfolios, enrollment, and performance.",
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const [view, setView] = useState<"table" | "cards">("cards");
  const [autoSwitchedToTable, setAutoSwitchedToTable] = useState(false);
  const [sortBy, setSortBy] = useState<StudySortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<StudySortDirection>("asc");
  const { studies, isLoading, error } = useStudiesData({ fallbackStudies });

  const {
    searchQuery,
    setSearchQuery,
    therapeuticAreas,
    phases,
    statuses,
    portfolios,
    programs,
    regions,
    filteredStudies,
    resetKey,
    selectedTherapeuticAreas,
    selectedPhase,
    selectedStatus,
    selectedPortfolio,
    selectedProgram,
    selectedRegion,
    toggleTherapeuticArea,
    clearTherapeuticAreas,
    togglePhase,
    clearPhases,
    toggleStatus,
    clearStatuses,
    togglePortfolio,
    clearPortfolios,
    toggleProgram,
    clearPrograms,
    toggleRegion,
    clearRegions,
  } = useStudyFilters(studies);

  const sortedStudies = useMemo(() => {
    return sortStudies(filteredStudies, sortBy, sortDirection);
  }, [filteredStudies, sortBy, sortDirection]);

  const {
    visibleItems: visibleStudies,
    visibleCount,
    loadMoreRef,
  } = useIncrementalList(sortedStudies, {
    initialCount: INITIAL_ROWS,
    incrementCount: LOAD_MORE_ROWS,
    resetKey: `${view}-${resetKey}-${sortBy ?? "none"}-${sortDirection}`,
  });

  const handleSortChange = (key: StudySortKey) => {
    if (sortBy === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(key);
    setSortDirection("asc");
  };

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-6" aria-busy={isLoading}>
      <span className="sr-only" role="status">
        {isLoading ? "Loading studies" : error ? "Showing fallback studies data" : "Studies loaded"}
      </span>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Portfolio Dashboard</h1>
        <InsightsButton />
      </div>

      <DataStateBanner error={error} className="mt-4" />

      <div className="mt-5">
        <PortfolioFilters
          total={filteredStudies.length}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          therapeuticAreas={therapeuticAreas}
          selectedTherapeuticAreas={selectedTherapeuticAreas}
          onToggleTherapeuticArea={toggleTherapeuticArea}
          onClearTherapeuticAreas={clearTherapeuticAreas}
          phases={phases}
          selectedPhases={selectedPhase ? [selectedPhase] : []}
          onTogglePhase={togglePhase}
          onClearPhases={clearPhases}
          statuses={statuses}
          selectedStatuses={selectedStatus ? [selectedStatus] : []}
          onToggleStatus={toggleStatus}
          onClearStatuses={clearStatuses}
          portfolios={portfolios}
          selectedPortfolios={selectedPortfolio ? [selectedPortfolio] : []}
          onTogglePortfolio={togglePortfolio}
          onClearPortfolios={clearPortfolios}
          programs={programs}
          selectedPrograms={selectedProgram ? [selectedProgram] : []}
          onToggleProgram={toggleProgram}
          onClearPrograms={clearPrograms}
          regions={regions}
          selectedRegions={selectedRegion ? [selectedRegion] : []}
          onToggleRegion={toggleRegion}
          onClearRegions={clearRegions}
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
        <KpiCard
          label="Schedule Adherence"
          value="90.1%"
          sub="12,416 of 13,782 planned"
          accent="violet"
        />
        <KpiCard label="Velocity vs Plan" value="62.5%" sub="avg enrollment speed" accent="teal" />
      </div>

      <div className="mt-5 flex justify-end">
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="mt-3">
        {view === "table" ? (
          <>
            <StudyTable
              studies={visibleStudies}
              totalCount={filteredStudies.length}
              visibleCount={visibleCount}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
            />
            <div ref={loadMoreRef} className="h-px w-full" aria-hidden="true" />
          </>
        ) : (
          <>
            <StudyCardGrid studies={visibleStudies} />
            <div ref={loadMoreRef} className="h-px w-full" aria-hidden="true" />
          </>
        )}
      </div>
    </main>
  );
}
