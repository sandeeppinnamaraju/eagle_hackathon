import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { KpiCardsGrid } from "@/components/kpi-cards-grid";
import { PortfolioFilters } from "@/components/portfolio-filters";
import { InsightsButton } from "@/components/insights-button";
import { ViewToggle } from "@/components/view-toggle";
import { StudyTable } from "@/components/study-table";
import { StudyCardGrid } from "@/components/study-card-grid";
import { DataStateBanner } from "@/components/data-state-banner";
import { useKpiDetails } from "@/hooks/use-kpi-details";
import { useInfiniteStudies } from "@/hooks/use-infinite-studies";
import { studies as allMockStudies } from "@/lib/data";
import { getStudyRegion } from "@/hooks/use-study-filters";

const toSortedUnique = (values: string[]) =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

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

  const {
    studies,
    total,
    isLoading,
    error,
    loadMoreRef,
    search,
    setSearch,
    filters,
    sortBy,
    sortOrder,
    handleSortChange,
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
  } = useInfiniteStudies();

  const { data: kpiData, isLoading: isKpiLoading } = useKpiDetails();

  // Auto-switch to table view when the user types a search query
  useEffect(() => {
    if (search.trim().length > 0 && view === "cards" && !autoSwitchedToTable) {
      setView("table");
      setAutoSwitchedToTable(true);
    }
    if (search.trim().length === 0) {
      setAutoSwitchedToTable(false);
    }
  }, [search, view, autoSwitchedToTable]);

  // Derive filter option lists from the full static dataset (all possible values)
  const therapeuticAreas = useMemo(
    () => toSortedUnique(allMockStudies.map((s) => s.therapeuticArea)),
    [],
  );
  const phases = useMemo(() => toSortedUnique(allMockStudies.map((s) => s.phase)), []);
  const statuses = useMemo(() => toSortedUnique(allMockStudies.map((s) => s.status)), []);
  const portfolios = useMemo(() => toSortedUnique(allMockStudies.map((s) => s.portfolio)), []);
  const programs = useMemo(() => toSortedUnique(allMockStudies.map((s) => s.program)), []);
  const regions = useMemo(
    () => toSortedUnique(allMockStudies.map((s) => getStudyRegion(s.countries))),
    [],
  );

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-6" aria-busy={isLoading}>
      <span className="sr-only" role="status">
        {isLoading ? "Loading studies" : error ? "Error loading studies" : "Studies loaded"}
      </span>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Portfolio Dashboard</h1>
        {/* <InsightsButton /> */}
      </div>

      <DataStateBanner error={error} className="mt-4" />

      <div className="mt-5">
        <PortfolioFilters
          total={total}
          loadedCount={studies.length}
          searchQuery={search}
          onSearchQueryChange={setSearch}
          therapeuticAreas={therapeuticAreas}
          selectedTherapeuticAreas={filters.therapeuticAreas}
          onToggleTherapeuticArea={toggleTherapeuticArea}
          onClearTherapeuticAreas={clearTherapeuticAreas}
          phases={phases}
          selectedPhases={filters.phase ? [filters.phase] : []}
          onTogglePhase={togglePhase}
          onClearPhases={clearPhases}
          statuses={statuses}
          selectedStatuses={filters.status ? [filters.status] : []}
          onToggleStatus={toggleStatus}
          onClearStatuses={clearStatuses}
          portfolios={portfolios}
          selectedPortfolios={filters.portfolio ? [filters.portfolio] : []}
          onTogglePortfolio={togglePortfolio}
          onClearPortfolios={clearPortfolios}
          programs={programs}
          selectedPrograms={filters.program ? [filters.program] : []}
          onToggleProgram={toggleProgram}
          onClearPrograms={clearPrograms}
          regions={regions}
          selectedRegions={filters.region ? [filters.region] : []}
          onToggleRegion={toggleRegion}
          onClearRegions={clearRegions}
        />
      </div>

      <KpiCardsGrid data={kpiData} isLoading={isKpiLoading} />

      <div className="mt-5 flex justify-end">
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="mt-3">
        {view === "table" ? (
          <>
            <StudyTable
              studies={studies}
              totalCount={total}
              visibleCount={studies.length}
              useInfiniteScrollDisplay
              sortBy={sortBy}
              sortDirection={sortOrder}
              onSortChange={handleSortChange}
            />
            <div ref={loadMoreRef} className="h-px w-full" aria-hidden="true" />
          </>
        ) : (
          <>
            <StudyCardGrid studies={studies} />
            <div ref={loadMoreRef} className="h-px w-full" aria-hidden="true" />
          </>
        )}
      </div>
    </main>
  );
}


