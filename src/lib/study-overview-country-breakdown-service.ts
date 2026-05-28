import type { CountryBreakdown, SiteRow, StudyRange } from "@/components/study-overview/types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type {
  StudyOverviewCountryBreakdownApiCountry,
  StudyOverviewCountryBreakdownApiResponse,
  StudyOverviewCountryBreakdownApiSite,
  StudyOverviewCountryBreakdownData,
  StudyOverviewCountryBreakdownQuery,
  StudyOverviewCountryBreakdownResult,
} from "@/lib/study-overview-country-breakdown-types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toArrayRecords = <T extends Record<string, unknown>>(value: unknown): T[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => isRecord(item)) as T[];
};

const toTimeHorizonLabel = (timeHorizon: StudyRange): string => {
  switch (timeHorizon) {
    case "since":
      return "Since FPI";
    case "last3":
      return "Last 3 Months";
    case "full":
    default:
      return "Full Study";
  }
};

const normalizePercent = (value: number): number => {
  if (value > 0 && value <= 1) {
    return value * 100;
  }
  return value;
};

const normalizeCountryStatus = (value: unknown): CountryBreakdown["status"] => {
  const normalized = toStringOrNull(value)?.toUpperCase().replace(/\s+/g, "_");
  if (normalized === "ON_TRACK") return "On Track";
  if (normalized === "AT_RISK") return "At Risk";
  if (normalized === "OFF_TRACK") return "Off Track";
  return "At Risk";
};

const normalizeSiteStatus = (value: unknown): SiteRow["status"] => {
  const normalized = toStringOrNull(value)?.toUpperCase().replace(/\s+/g, "_");
  if (normalized === "ENROLLING") return "ENROLLING";
  if (normalized === "ON_HOLD") return "ON HOLD";
  if (normalized === "SCREENING") return "SCREENING";
  if (normalized === "CLOSED") return "CLOSED";
  return "ENROLLING";
};

const fallbackData = (query: StudyOverviewCountryBreakdownQuery): StudyOverviewCountryBreakdownData => ({
  countries: query.fallbackCountries,
  sites: query.fallbackSites,
  timeHorizonLabel: toTimeHorizonLabel(query.timeHorizon),
});

const mapSite = (site: StudyOverviewCountryBreakdownApiSite, countryName: string, index: number): SiteRow => {
  const target = toFiniteNumber(site.target) ?? 0;
  const actual = toFiniteNumber(site.actual) ?? 0;
  const rawPct = toFiniteNumber(site.percentEnrolled);

  return {
    id: toStringOrNull(site.siteId) ?? `SITE-${index + 1}`,
    name: toStringOrNull(site.siteName) ?? `Site ${index + 1}`,
    country: countryName,
    target,
    actual,
    pct: rawPct == null ? (target > 0 ? (actual / target) * 100 : 0) : normalizePercent(rawPct),
    status: normalizeSiteStatus(site.status),
  };
};

const mapCountry = (country: StudyOverviewCountryBreakdownApiCountry, fallbackStatus: CountryBreakdown["status"]): CountryBreakdown => {
  const target = toFiniteNumber(country.target) ?? 0;
  const actual = toFiniteNumber(country.actual) ?? 0;
  const rawPct = toFiniteNumber(country.percentEnrolled);

  return {
    name: toStringOrNull(country.country) ?? "Unknown",
    target,
    actual,
    pct: rawPct == null ? (target > 0 ? (actual / target) * 100 : 0) : normalizePercent(rawPct),
    sitesActive: toFiniteNumber(country.sitesActive) ?? 0,
    avgRate: toFiniteNumber(country.avgRate) ?? 0,
    status: normalizeCountryStatus(country.status) ?? fallbackStatus,
  };
};

const mapPayload = (
  payload: StudyOverviewCountryBreakdownApiResponse,
  query: StudyOverviewCountryBreakdownQuery,
): StudyOverviewCountryBreakdownData => {
  const countriesRaw = toArrayRecords<StudyOverviewCountryBreakdownApiCountry>(payload.countries);
  if (countriesRaw.length === 0) {
    return fallbackData(query);
  }

  const countries = countriesRaw.map((country, index) => mapCountry(country, query.fallbackCountries[index]?.status ?? "At Risk"));
  const sites = countriesRaw.flatMap((country, countryIndex) => {
    const countryName = countries[countryIndex]?.name ?? "Unknown";
    return toArrayRecords<StudyOverviewCountryBreakdownApiSite>(country.sites).map((site, siteIndex) =>
      mapSite(site, countryName, siteIndex),
    );
  });

  return {
    countries,
    sites: sites.length > 0 ? sites : query.fallbackSites,
    timeHorizonLabel: toStringOrNull(payload.timeHorizon) ?? toTimeHorizonLabel(query.timeHorizon),
  };
};

async function fetchCountryBreakdown(
  query: StudyOverviewCountryBreakdownQuery,
  signal?: AbortSignal,
): Promise<StudyOverviewCountryBreakdownApiResponse> {
  const params = new URLSearchParams({
    timeHorizon: toTimeHorizonLabel(query.timeHorizon),
    studyId: query.studyId,
  });
  const path = `/api/study-overview/breakdown/countries?${params.toString()}`;
  const response = await fetch(
    withApiBaseUrl(path, path),
    withApiRequestConfig({ method: "GET", signal }),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch country breakdown: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected country breakdown API response shape");
  }

  return payload as StudyOverviewCountryBreakdownApiResponse;
}

export const studyOverviewCountryBreakdownService = {
  async getCountryBreakdown(
    query: StudyOverviewCountryBreakdownQuery,
    signal?: AbortSignal,
  ): Promise<StudyOverviewCountryBreakdownResult> {
    try {
      const payload = await fetchCountryBreakdown(query, signal);
      return {
        data: mapPayload(payload, query),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load country breakdown from API");

      return {
        data: fallbackData(query),
        source: "fallback",
        error: normalizedError,
      };
    }
  },
};
