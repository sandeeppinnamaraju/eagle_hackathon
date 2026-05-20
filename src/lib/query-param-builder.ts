import type { StudiesQuery } from "@/lib/studies-service-types";

/**
 * Builds a URLSearchParams string from a StudiesQuery.
 * Used by the real API service; unused by the mock service.
 */
export function buildStudiesQueryParams(query: StudiesQuery): string {
  const params = new URLSearchParams();

  params.set("page", String(query.page));
  params.set("limit", String(query.limit));

  if (query.search && query.search.trim().length > 0) {
    params.set("search", query.search.trim());
  }

  if (query.therapeuticAreas && query.therapeuticAreas.length > 0) {
    query.therapeuticAreas.forEach((area) => params.append("therapeuticArea", area));
  }

  if (query.phase) params.set("phase", query.phase);
  if (query.status) params.set("status", query.status);
  if (query.portfolio) params.set("portfolio", query.portfolio);
  if (query.program) params.set("program", query.program);
  if (query.region) params.set("region", query.region);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);

  return params.toString();
}
