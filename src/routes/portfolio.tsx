import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useKpiDetails } from "@/hooks/use-kpi-details";
import { useInfiniteStudies } from "@/hooks/use-infinite-studies";
import { useIncrementalList } from "@/hooks/use-incremental-list";
import { KpiCard } from "@/components/kpi-card";
import { PortfolioFilters, emptyFilters, type FilterState } from "@/components/portfolio-filters";
import { InsightsButton } from "@/components/insights-button";
import { ViewToggle } from "@/components/view-toggle";
import { StudyTable } from "@/components/study-table";
import { StudyCardGrid } from "@/components/study-card-grid";
import type { Study } from "@/lib/data";

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
  const [filterOptionSourceStudies, setFilterOptionSourceStudies] = useState<Study[]>([]);
  const {
    studies: loadedStudies,
    total: studiesTotal,
    hasMore,
    isLoading: isStudiesLoading,
    loadMoreRef,
    setSearch,
    setFilters: setApiFilters,
    sortBy,
    sortOrder,
    handleSortChange,
  } = useInfiniteStudies();

  const kpiQuery = useMemo(
    () => ({
      search: filters.search,
      therapeuticAreas: filters.areas,
      phase: filters.phase,
      status: filters.status,
      portfolio: filters.portfolio,
      program: filters.program,
      region: filters.region,
      fpiStartDate: filters.fpiFrom,
      fpiEndDate: filters.fpiTo,
      lpoStartDate: filters.lpoFrom,
      lpoEndDate: filters.lpoTo,
    }),
    [
      filters.areas,
      filters.fpiFrom,
      filters.fpiTo,
      filters.lpoFrom,
      filters.lpoTo,
      filters.phase,
      filters.portfolio,
      filters.program,
      filters.region,
      filters.search,
      filters.status,
    ],
  );

  useEffect(() => {
    setSearch(filters.search);
  }, [filters.search, setSearch]);

  useEffect(() => {
    setApiFilters({
      therapeuticAreas: filters.areas,
      phase: filters.phase,
      status: filters.status,
      portfolio: filters.portfolio,
      program: filters.program,
      region: filters.region,
      fpiStartDate: filters.fpiFrom,
      fpiEndDate: filters.fpiTo,
      lpoStartDate: filters.lpoFrom,
      lpoEndDate: filters.lpoTo,
    });
  }, [
    filters.areas,
    filters.fpiFrom,
    filters.fpiTo,
    filters.lpoFrom,
    filters.lpoTo,
    filters.phase,
    filters.portfolio,
    filters.program,
    filters.region,
    filters.status,
    setApiFilters,
  ]);

  useEffect(() => {
    setFilterOptionSourceStudies((previous) => {
      const uniqueById = new Map<string, Study>();

      for (const study of previous) {
        uniqueById.set(study.id, study);
      }

      for (const study of loadedStudies) {
        uniqueById.set(study.id, study);
      }

      return Array.from(uniqueById.values());
    });
  }, [loadedStudies]);

  const { data: kpiData } = useKpiDetails(kpiQuery);

  const filtered = loadedStudies;
  const totalStudies = studiesTotal;
  const hasDateFilters = Boolean(filters.fpiFrom || filters.fpiTo || filters.lpoFrom || filters.lpoTo);
  const cardsResetKey = JSON.stringify({
    search: filters.search,
    areas: filters.areas,
    phase: filters.phase,
    status: filters.status,
    portfolio: filters.portfolio,
    program: filters.program,
    region: filters.region,
    fpiFrom: filters.fpiFrom,
    fpiTo: filters.fpiTo,
    lpoFrom: filters.lpoFrom,
    lpoTo: filters.lpoTo,
    sortBy,
    sortOrder,
  });
  const {
    visibleItems: visibleCardStudies,
    visibleCount: visibleCardCount,
    loadMoreRef: cardsLoadMoreRef,
  } = useIncrementalList(filtered, {
    initialCount: 9,
    incrementCount: 9,
    resetKey: cardsResetKey,
  });

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatCount = (value: number) => value.toLocaleString();

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
          studies={filterOptionSourceStudies}
          total={totalStudies}
          shown={filtered.length}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Active Studies"
          value={formatCount(kpiData?.activeStudiesCount ?? 0)}
          sub="recruiting or follow-up"
          accent="primary"
        />
        <KpiCard
          label="On Track"
          value={formatPercentage(kpiData?.onTrack.percentage ?? 0)}
          sub={`${formatCount(kpiData?.onTrack.count ?? 0)} of ${formatCount(kpiData?.activeStudiesCount ?? 0)} active`}
          accent="success"
        />
        <KpiCard
          label="At Risk / Off Track"
          value={formatPercentage(kpiData?.offTrackOrAtRisk.percentage ?? 0)}
          sub={`${formatCount(kpiData?.offTrackOrAtRisk.count ?? 0)} of ${formatCount(kpiData?.activeStudiesCount ?? 0)} active`}
          accent="warning"
        />
        <KpiCard
          label="Enrollment vs Target"
          value={formatPercentage(kpiData?.enrollmentVsTarget.percentage ?? 0)}
          sub={`${formatCount(kpiData?.enrollmentVsTarget.sumActual ?? 0)} of ${formatCount(kpiData?.enrollmentVsTarget.sumTarget ?? 0)} patients`}
          accent="info"
          spark={[2, 4, 5, 8, 11, 14]}
        />
        <KpiCard
          label="Enrollment vs Plan (To Date)"
          value={formatPercentage(kpiData?.scheduleAdherence.percentage ?? 0)}
          sub={`${formatCount(kpiData?.scheduleAdherence.completed ?? 0)} of ${formatCount(kpiData?.scheduleAdherence.planned ?? 0)} planned`}
          accent="violet"
        />
        <KpiCard
          label="Velocity vs Plan"
          value={formatPercentage(kpiData?.velocityVsPlan.average ?? 0)}
          sub="avg enrollment speed"
          accent="teal"
        />
      </div>

      <div className="mt-5 flex justify-end">
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="mt-3">
        {isStudiesLoading && loadedStudies.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            Loading studies...
          </div>
        ) : view === "table" ? (
          <div className="space-y-3">
          <StudyTable
            studies={filtered}
            totalCount={totalStudies}
            visibleCount={filtered.length}
            useInfiniteScrollDisplay={!hasDateFilters}
            sortBy={sortBy}
            sortDirection={sortOrder}
            onSortChange={handleSortChange}
          />
          {hasMore && <div ref={loadMoreRef} className="h-8" aria-hidden="true" />}
          </div>
        ) : (
          <div className="space-y-3">
            <StudyCardGrid studies={visibleCardStudies} />
            {visibleCardCount < filtered.length && <div ref={cardsLoadMoreRef} className="h-8" aria-hidden="true" />}
            {hasMore && <div ref={loadMoreRef} className="h-8" aria-hidden="true" />}
          </div>
        )}
      </div>
    </main>
  );
}
