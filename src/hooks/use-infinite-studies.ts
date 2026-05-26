import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { studiesService } from "@/lib/studies-service";
import type { StudiesQuery } from "@/lib/studies-service-types";
import type { Study } from "@/lib/data";
import type { StudySortDirection, StudySortKey } from "@/lib/study-sorting";

const DEFAULT_LIMIT = 200;
const DEFAULT_APPEND_DELAY_MS = 0;
const SCROLL_ROOT_MARGIN = "1000px";

const getScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
  let current = element?.parentElement ?? null;

  while (current) {
    const styles = window.getComputedStyle(current);
    const overflowY = styles.overflowY;
    const canScroll = (overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight;

    if (canScroll) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
};

export interface UseInfiniteStudiesOptions {
  /** Override the page size (default: 200). */
  limit?: number;
  /** Delay before append fetch executes (default: 0ms). */
  appendDelayMs?: number;
}

export interface StudiesFilters {
  therapeuticAreas: string[];
  phase: string | null;
  status: string | null;
  portfolio: string | null;
  program: string | null;
  region: string | null;
  fpiStartDate: string | null;
  fpiEndDate: string | null;
  lpoStartDate: string | null;
  lpoEndDate: string | null;
}

const EMPTY_FILTERS: StudiesFilters = {
  therapeuticAreas: [],
  phase: null,
  status: null,
  portfolio: null,
  program: null,
  region: null,
  fpiStartDate: null,
  fpiEndDate: null,
  lpoStartDate: null,
  lpoEndDate: null,
};

export interface UseInfiniteStudiesResult {
  /** Accumulated studies across all loaded pages. */
  studies: Study[];
  /** Total matching records reported by the service. */
  total: number;
  /** Whether the service reports more pages available. */
  hasMore: boolean;
  /** True while any fetch is in progress. */
  isLoading: boolean;
  /** Last error from the service, null when healthy. */
  error: Error | null;
  /** Ref callback to attach to a sentinel element at the bottom of the list. */
  loadMoreRef: React.RefCallback<HTMLDivElement>;
  /** Current debounced search value. */
  search: string;
  /** Update the search input. Triggers debounce then resets + fetches. */
  setSearch: (value: string) => void;
  /** Current filter values. */
  filters: StudiesFilters;
  /** Current applied studies API query after debounce/filter state. */
  activeQuery: StudiesQuery;
  /** Current sort key. */
  sortBy: StudySortKey | null;
  /** Current sort direction. */
  sortOrder: StudySortDirection;
  /** Toggle sort on a column (same column → flip direction). */
  handleSortChange: (key: StudySortKey) => void;
  /** Replace all filter values at once. Resets + fetches. */
  setFilters: (filters: Partial<StudiesFilters>) => void;
  /** Toggle a therapeutic area in/out of the multi-select. */
  toggleTherapeuticArea: (area: string) => void;
  clearTherapeuticAreas: () => void;
  /** Toggle a single-select filter. Calling with the current value clears it. */
  togglePhase: (value: string) => void;
  clearPhases: () => void;
  toggleStatus: (value: string) => void;
  clearStatuses: () => void;
  togglePortfolio: (value: string) => void;
  clearPortfolios: () => void;
  toggleProgram: (value: string) => void;
  clearPrograms: () => void;
  toggleRegion: (value: string) => void;
  clearRegions: () => void;
}

/**
 * Manages backend-driven infinite-scroll for studies.
 *
 * – Fetching, debounce, filtering, sorting, and error
 *   handling are all encapsulated here.
 * – UI components only consume the returned values and callbacks.
 * – Works with the mock service today; switching to the real API
 *   requires no changes here or in any component.
 */
export function useInfiniteStudies(options: UseInfiniteStudiesOptions = {}): UseInfiniteStudiesResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const appendDelayMs = options.appendDelayMs ?? DEFAULT_APPEND_DELAY_MS;

  // ─── Core state ─────────────────────────────────────────────────────────
  const [studies, setStudies] = useState<Study[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ─── Search (raw input + debounced value) ────────────────────────────────
  const [rawSearch, setRawSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(rawSearch), 300);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  // ─── Filters ────────────────────────────────────────────────────────────
  const [filters, setFiltersState] = useState<StudiesFilters>(EMPTY_FILTERS);

  // ─── Sorting ─────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<StudySortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<StudySortDirection>("asc");

  // ─── Stale-request guard ─────────────────────────────────────────────────
  const abortRef = useRef<AbortController | null>(null);
  const currentPageRef = useRef(0);
  const appendInFlightRef = useRef(false);
  const hasMoreRef = useRef(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // ─── Fetch function ──────────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (appendMode: boolean) => {
      if (appendMode && !hasMoreRef.current) {
        return;
      }

      if (appendMode && appendInFlightRef.current) {
        return;
      }

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      isLoadingRef.current = true;
      setIsLoading(true);
      if (!appendMode) {
        setError(null);
        currentPageRef.current = 0;
      }

      if (appendMode) {
        appendInFlightRef.current = true;

        if (appendDelayMs > 0) {
          await new Promise<void>((resolve) => {
            const timeoutId = window.setTimeout(() => {
              controller.signal.removeEventListener("abort", onAbort);
              resolve();
            }, appendDelayMs);

            const onAbort = () => {
              window.clearTimeout(timeoutId);
              resolve();
            };

            controller.signal.addEventListener("abort", onAbort, { once: true });
          });

          if (controller.signal.aborted) {
            return;
          }
        }
      }

      const page = appendMode ? currentPageRef.current + 1 : 1;

      const query: StudiesQuery = {
        page,
        limit,
        search: debouncedSearch,
        therapeuticAreas: filters.therapeuticAreas,
        phase: filters.phase,
        status: filters.status,
        portfolio: filters.portfolio,
        program: filters.program,
        region: filters.region,
        fpiStartDate: filters.fpiStartDate,
        fpiEndDate: filters.fpiEndDate,
        lpoStartDate: filters.lpoStartDate,
        lpoEndDate: filters.lpoEndDate,
        sortBy,
        sortOrder,
      };

      try {
        const result = await studiesService.getStudies(query, controller.signal);

        if (controller.signal.aborted) return;

        currentPageRef.current = result.page;
        hasMoreRef.current = result.hasMore;
        setStudies((prev) => {
          if (!appendMode) {
            return result.items;
          }

          const existingIds = new Set(prev.map((study) => study.id));
          const nextItems = result.items.filter((study) => !existingIds.has(study.id));
          return [...prev, ...nextItems];
        });
        setTotal(result.total);
        setHasMore(result.hasMore);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        const normalized = err instanceof Error ? err : new Error("Failed to load studies");
        console.error(normalized);
        setError(normalized);
      } finally {
        if (appendMode) {
          appendInFlightRef.current = false;
        }

        if (abortRef.current === controller) {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [limit, appendDelayMs, debouncedSearch, filters, sortBy, sortOrder],
  );

  // ─── Reset + fetch fresh when query params change ───────────────────────
  useEffect(() => {
    fetchPage(false);
    // fetchPage already captures all relevant state via its deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage]);

  // ─── Sentinel / intersection observer for infinite scroll ───────────────
  const [sentinelElement, setSentinelElement] = useState<HTMLDivElement | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    setSentinelElement(node);
  }, []);

  useEffect(() => {
    const sentinel = sentinelElement;
    if (!sentinel) return;
    const root = getScrollableParent(sentinel);

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMoreRef.current &&
          !isLoadingRef.current &&
          !appendInFlightRef.current
        ) {
          fetchPage(true);
        }
      },
      { root, rootMargin: SCROLL_ROOT_MARGIN, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPage, sentinelElement]);

  // ─── Filter helpers ──────────────────────────────────────────────────────
  const setFilters = useCallback((partial: Partial<StudiesFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleTherapeuticArea = useCallback((area: string) => {
    setFiltersState((prev) => ({
      ...prev,
      therapeuticAreas: prev.therapeuticAreas.includes(area)
        ? prev.therapeuticAreas.filter((a) => a !== area)
        : [...prev.therapeuticAreas, area],
    }));
  }, []);

  const clearTherapeuticAreas = useCallback(() => {
    setFiltersState((prev) => ({ ...prev, therapeuticAreas: [] }));
  }, []);

  const makeSingleToggle = (field: keyof Omit<StudiesFilters, "therapeuticAreas">) =>
    (value: string) =>
      setFiltersState((prev) => ({ ...prev, [field]: value }));

  const makeSingleClear = (field: keyof Omit<StudiesFilters, "therapeuticAreas">) =>
    () => setFiltersState((prev) => ({ ...prev, [field]: null }));

  const activeQuery = useMemo<StudiesQuery>(
    () => ({
      page: 1,
      limit,
      search: debouncedSearch,
      therapeuticAreas: filters.therapeuticAreas,
      phase: filters.phase,
      status: filters.status,
      portfolio: filters.portfolio,
      program: filters.program,
      region: filters.region,
      fpiStartDate: filters.fpiStartDate,
      fpiEndDate: filters.fpiEndDate,
      lpoStartDate: filters.lpoStartDate,
      lpoEndDate: filters.lpoEndDate,
      sortBy,
      sortOrder,
    }),
    [debouncedSearch, filters, limit, sortBy, sortOrder],
  );

  // These are stable because setFiltersState is stable
  const togglePhase = useMemo(() => makeSingleToggle("phase"), []); // eslint-disable-line react-hooks/exhaustive-deps
  const clearPhases = useMemo(() => makeSingleClear("phase"), []); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleStatus = useMemo(() => makeSingleToggle("status"), []); // eslint-disable-line react-hooks/exhaustive-deps
  const clearStatuses = useMemo(() => makeSingleClear("status"), []); // eslint-disable-line react-hooks/exhaustive-deps
  const togglePortfolio = useMemo(() => makeSingleToggle("portfolio"), []); // eslint-disable-line react-hooks/exhaustive-deps
  const clearPortfolios = useMemo(() => makeSingleClear("portfolio"), []); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleProgram = useMemo(() => makeSingleToggle("program"), []); // eslint-disable-line react-hooks/exhaustive-deps
  const clearPrograms = useMemo(() => makeSingleClear("program"), []); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleRegion = useMemo(() => makeSingleToggle("region"), []); // eslint-disable-line react-hooks/exhaustive-deps
  const clearRegions = useMemo(() => makeSingleClear("region"), []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sort helper ─────────────────────────────────────────────────────────
  const handleSortChange = useCallback((key: StudySortKey) => {
    if (sortBy === key) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(key);
    setSortOrder("asc");
  }, [sortBy]);

  return {
    studies,
    total,
    hasMore,
    isLoading,
    error,
    loadMoreRef,
    search: rawSearch,
    setSearch: setRawSearch,
    filters,
    activeQuery,
    sortBy,
    sortOrder,
    handleSortChange,
    setFilters,
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
  };
}
