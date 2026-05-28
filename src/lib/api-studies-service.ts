import { buildStudiesQueryParams } from "@/lib/query-param-builder";
import type { IStudiesService, StudiesPage, StudiesQuery } from "@/lib/studies-service-types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";

const STUDIES_API_PATH = "/api/v1/study-protocol/studies";
const STUDIES_API_FALLBACK_URL = "/api/v1/study-protocol/studies";

function normalizeStudiesPage(payload: unknown, query: StudiesQuery): StudiesPage {
  if (!payload || typeof payload !== "object") {
    throw new Error("Unexpected API response shape");
  }

  const pageCandidate = payload as Partial<StudiesPage>;
  const items = pageCandidate.items;

  if (!Array.isArray(items)) {
    throw new Error("Unexpected API response shape");
  }

  const page = typeof pageCandidate.page === "number" ? pageCandidate.page : query.page;
  const limit = typeof pageCandidate.limit === "number" ? pageCandidate.limit : query.limit;
  const total = typeof pageCandidate.total === "number" ? pageCandidate.total : page * limit + (items.length === limit ? 1 : 0);
  const hasMore =
    typeof pageCandidate.hasMore === "boolean"
      ? pageCandidate.hasMore
      : typeof pageCandidate.total === "number"
        ? page * limit < pageCandidate.total
        : items.length === limit;

  return {
    items,
    page,
    limit,
    total,
    hasMore,
  };
}

/**
 * Real API implementation of IStudiesService.
 *
 * Switching from mock to real API requires only setting
 * VITE_USE_MOCK_DATA=false (or removing the variable).
 * No UI component changes needed.
 */
export const apiStudiesService: IStudiesService = {
  async getStudies(query: StudiesQuery, signal?: AbortSignal): Promise<StudiesPage> {
    const qs = buildStudiesQueryParams(query);
    const studiesUrl = withApiBaseUrl(STUDIES_API_PATH, STUDIES_API_FALLBACK_URL);
    const response = await fetch(
      `${studiesUrl}?${qs}`,
      withApiRequestConfig({
        method: "GET",
        signal,
      }),
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch studies: ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    return normalizeStudiesPage(payload, query);
  },
};
