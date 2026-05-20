import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { StudyTable } from "@/components/study-table";
import { DataStateBanner } from "@/components/data-state-banner";
import { PortfolioFilters } from "@/components/portfolio-filters";
import { useIncrementalList } from "../hooks/use-incremental-list";
import { useStudyFilters } from "@/hooks/use-study-filters";
import { useStudiesData } from "../hooks/use-studies-data";
import { studies as fallbackStudies } from "@/lib/data";
import type { StudySortDirection, StudySortKey } from "@/lib/study-sorting";
import { sortStudies } from "@/lib/study-sorting";

const INITIAL_ROWS = 25;
const LOAD_MORE_ROWS = 25;

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
  const [sortBy, setSortBy] = useState<StudySortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<StudySortDirection>("asc");
  const { studies: allStudies, isLoading: isLoadingStudies, error } = useStudiesData({ fallbackStudies });

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
  } = useStudyFilters(allStudies);

  const sortedStudies = useMemo(
    () => sortStudies(filteredStudies, sortBy, sortDirection),
    [filteredStudies, sortBy, sortDirection],
  );

  const handleSortChange = (key: StudySortKey) => {
    if (sortBy === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(key);
    setSortDirection("asc");
  };

  const { visibleItems: visibleStudies, visibleCount, loadMoreRef } = useIncrementalList(sortedStudies, {
    initialCount: INITIAL_ROWS,
    incrementCount: LOAD_MORE_ROWS,
    resetKey: `${resetKey}-${sortBy ?? "none"}-${sortDirection}`,
  });

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-6" aria-busy={isLoadingStudies}>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Studies</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Full catalog of clinical studies across all portfolios.
      </p>
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
      <div className="mt-5">
        <StudyTable
          studies={visibleStudies}
          totalCount={filteredStudies.length}
          visibleCount={visibleStudies.length}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      </div>
      <div ref={loadMoreRef} className="h-px w-full" aria-hidden="true" />
    </main>
  );
}
