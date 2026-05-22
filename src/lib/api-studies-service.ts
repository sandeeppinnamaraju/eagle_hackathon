import { buildStudiesQueryParams } from "@/lib/query-param-builder";
import type { IStudiesService, StudiesPage, StudiesQuery } from "@/lib/studies-service-types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";

const STUDIES_API_PATH = "/api/study-protocol/studies";
const STUDIES_API_FALLBACK_URL = "/api/study-protocol/studies";

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

    const payload = (await response.json()) as StudiesPage;

    if (!payload || !Array.isArray(payload.items)) {
      throw new Error("Unexpected API response shape");
    }

    return payload;
  },
};
