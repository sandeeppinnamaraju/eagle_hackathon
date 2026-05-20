import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { StudyTable } from "@/components/study-table";
import { DataStateBanner } from "@/components/data-state-banner";
import { PortfolioFilters } from "@/components/portfolio-filters";
import { useInfiniteStudies } from "@/hooks/use-infinite-studies";
import { studies as allMockStudies } from "@/lib/data";
import { getStudyRegion } from "@/hooks/use-study-filters";

const toSortedUnique = (values: string[]) =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

export const Route = createFileRoute("/studies")({
  head: () => ({
    meta: [
      { title: "Studies — Flight Deck" },
      { name: "description", content: "Browse the complete catalog of clinical studies across portfolios and programs." },
    ],
  }),
  component: StudiesPage,
});

function StudiesPage() {
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
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Studies</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Full catalog of clinical studies across all portfolios.
      </p>
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
      <div className="mt-5">
        <StudyTable
          studies={studies}
          totalCount={total}
          visibleCount={studies.length}
          useInfiniteScrollDisplay
          sortBy={sortBy}
          sortDirection={sortOrder}
          onSortChange={handleSortChange}
        />
      </div>
      <div ref={loadMoreRef} className="h-px w-full" aria-hidden="true" />
    </main>
  );
}

