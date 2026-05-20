import { studies as allMockStudies } from "@/lib/data";
import { getStudyRegion } from "@/hooks/use-study-filters";
import { sortStudies } from "@/lib/study-sorting";
import type { IStudiesService, StudiesPage, StudiesQuery } from "@/lib/studies-service-types";

/**
 * Mock implementation of IStudiesService.
 *
 * Applies the same filtering/search/sorting/pagination logic the real API
 * would perform on the backend.  UI components are completely unaware of
 * whether this or the real API service is in use.
 */
export const mockStudiesService: IStudiesService = {
  async getStudies(query: StudiesQuery, _signal?: AbortSignal): Promise<StudiesPage> {
    // Simulate a realistic async round-trip so callers handle async correctly.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const { page, limit, search, therapeuticAreas, phase, status, portfolio, program, region, sortBy, sortOrder } = query;

    const normalizedSearch = (search ?? "").trim().toLowerCase();

    // 1. Filter
    let filtered = allMockStudies.filter((study) => {
      const searchMatch =
        normalizedSearch.length === 0 ||
        study.id.toLowerCase().includes(normalizedSearch) ||
        study.title.toLowerCase().includes(normalizedSearch) ||
        study.indication.toLowerCase().includes(normalizedSearch) ||
        study.therapeuticArea.toLowerCase().includes(normalizedSearch);

      const taMatch =
        !therapeuticAreas || therapeuticAreas.length === 0 || therapeuticAreas.includes(study.therapeuticArea);

      const phaseMatch = !phase || study.phase === phase;
      const statusMatch = !status || study.status === status;
      const portfolioMatch = !portfolio || study.portfolio === portfolio;
      const programMatch = !program || study.program === program;
      const regionMatch = !region || getStudyRegion(study.countries) === region;

      return searchMatch && taMatch && phaseMatch && statusMatch && portfolioMatch && programMatch && regionMatch;
    });

    // 2. Sort
    if (sortBy) {
      filtered = sortStudies(filtered, sortBy, sortOrder ?? "asc");
    }

    const total = filtered.length;

    // 3. Paginate
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + items.length < total;

    return { items, page, limit, total, hasMore };
  },
  // Update mock service to dynamically adjust item count as more data is loaded.
};
