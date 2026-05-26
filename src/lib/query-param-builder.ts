import type { StudiesQuery } from "@/lib/studies-service-types";
import type { KpiDetailsQuery } from "@/lib/kpi-details-types";

const appendStudyFilterQueryParams = (
  params: URLSearchParams,
  query: Pick<
    StudiesQuery,
    | "search"
    | "therapeuticAreas"
    | "phase"
    | "status"
    | "portfolio"
    | "program"
    | "region"
    | "fpiStartDate"
    | "fpiEndDate"
    | "lpoStartDate"
    | "lpoEndDate"
  >,
) => {
  const normalizeIsoDate = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

    const [yearRaw, monthRaw, dayRaw] = trimmed.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    const candidate = new Date(Date.UTC(year, month - 1, day));
    const isValid =
      candidate.getUTCFullYear() === year &&
      candidate.getUTCMonth() === month - 1 &&
      candidate.getUTCDate() === day;

    return isValid ? trimmed : null;
  };

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

  const fpiStartDate = normalizeIsoDate(query.fpiStartDate);
  const fpiEndDate = normalizeIsoDate(query.fpiEndDate);
  const lpoStartDate = normalizeIsoDate(query.lpoStartDate);
  const lpoEndDate = normalizeIsoDate(query.lpoEndDate);

  if (fpiStartDate) params.set("fpiStartDate", fpiStartDate);
  if (fpiEndDate) params.set("fpiEndDate", fpiEndDate);
  if (lpoStartDate) params.set("lpoStartDate", lpoStartDate);
  if (lpoEndDate) params.set("lpoEndDate", lpoEndDate);
};

/**
 * Builds a URLSearchParams string from a StudiesQuery.
 * Used by the real API service; unused by the mock service.
 */
export function buildStudiesQueryParams(query: StudiesQuery): string {
  const params = new URLSearchParams();

  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  appendStudyFilterQueryParams(params, query);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);

  return params.toString();
}

export function buildKpiDetailsQueryParams(query: KpiDetailsQuery): string {
  const params = new URLSearchParams();
  appendStudyFilterQueryParams(params, query);
  return params.toString();
}
