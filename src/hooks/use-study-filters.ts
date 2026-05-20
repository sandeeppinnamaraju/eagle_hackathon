import { useMemo, useState } from "react";
import type { Study } from "@/lib/data";

const toSortedUniqueValues = (values: string[]) =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

const toggleMultiSelectValue = (current: string[], value: string) =>
  current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];

const setSingleSelectValue = (_current: string | null, value: string) => value;

export const getStudyRegion = (countries: number): string => {
  if (countries >= 6) return "Global";
  if (countries >= 3) return "Multi-country";
  return "Local";
};

export function useStudyFilters(allStudies: Study[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTherapeuticAreas, setSelectedTherapeuticAreas] = useState<string[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const therapeuticAreas = useMemo(
    () => toSortedUniqueValues(allStudies.map((study) => study.therapeuticArea)),
    [allStudies],
  );

  const phases = useMemo(
    () => toSortedUniqueValues(allStudies.map((study) => study.phase)),
    [allStudies],
  );

  const statuses = useMemo(
    () => toSortedUniqueValues(allStudies.map((study) => study.status)),
    [allStudies],
  );

  const portfolios = useMemo(
    () => toSortedUniqueValues(allStudies.map((study) => study.portfolio)),
    [allStudies],
  );

  const programs = useMemo(
    () => toSortedUniqueValues(allStudies.map((study) => study.program)),
    [allStudies],
  );

  const regions = useMemo(
    () => toSortedUniqueValues(allStudies.map((study) => getStudyRegion(study.countries))),
    [allStudies],
  );

  const filteredStudies = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return allStudies.filter((study) => {
      const searchMatch =
        normalizedQuery.length === 0 ||
        study.id.toLowerCase().includes(normalizedQuery) ||
        study.title.toLowerCase().includes(normalizedQuery) ||
        study.indication.toLowerCase().includes(normalizedQuery) ||
        study.therapeuticArea.toLowerCase().includes(normalizedQuery);
      const therapeuticAreaMatch =
        selectedTherapeuticAreas.length === 0 || selectedTherapeuticAreas.includes(study.therapeuticArea);
      const phaseMatch = selectedPhase == null || selectedPhase === study.phase;
      const statusMatch = selectedStatus == null || selectedStatus === study.status;
      const portfolioMatch = selectedPortfolio == null || selectedPortfolio === study.portfolio;
      const programMatch = selectedProgram == null || selectedProgram === study.program;
      const regionMatch = selectedRegion == null || selectedRegion === getStudyRegion(study.countries);

      return searchMatch && therapeuticAreaMatch && phaseMatch && statusMatch && portfolioMatch && programMatch && regionMatch;
    });
  }, [
    allStudies,
    searchQuery,
    selectedPhase,
    selectedPortfolio,
    selectedProgram,
    selectedRegion,
    selectedStatus,
    selectedTherapeuticAreas,
  ]);

  const resetKey = JSON.stringify({
    searchQuery,
    selectedTherapeuticAreas,
    selectedPhase,
    selectedStatus,
    selectedPortfolio,
    selectedProgram,
    selectedRegion,
    studyCount: allStudies.length,
  });

  return {
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
    toggleTherapeuticArea: (area: string) => {
      setSelectedTherapeuticAreas((current) => toggleMultiSelectValue(current, area));
    },
    clearTherapeuticAreas: () => {
      setSelectedTherapeuticAreas([]);
    },
    togglePhase: (phase: string) => {
      setSelectedPhase((current) => setSingleSelectValue(current, phase));
    },
    clearPhases: () => {
      setSelectedPhase(null);
    },
    toggleStatus: (status: string) => {
      setSelectedStatus((current) => setSingleSelectValue(current, status));
    },
    clearStatuses: () => {
      setSelectedStatus(null);
    },
    togglePortfolio: (portfolio: string) => {
      setSelectedPortfolio((current) => setSingleSelectValue(current, portfolio));
    },
    clearPortfolios: () => {
      setSelectedPortfolio(null);
    },
    toggleProgram: (program: string) => {
      setSelectedProgram((current) => setSingleSelectValue(current, program));
    },
    clearPrograms: () => {
      setSelectedProgram(null);
    },
    toggleRegion: (region: string) => {
      setSelectedRegion((current) => setSingleSelectValue(current, region));
    },
    clearRegions: () => {
      setSelectedRegion(null);
    },
  };
}