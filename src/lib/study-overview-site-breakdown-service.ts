import type { SiteRow, StudyRange } from "@/components/study-overview/types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type {
  StudyOverviewSiteBreakdownApiResponse,
  StudyOverviewSiteBreakdownApiSite,
  StudyOverviewSiteBreakdownData,
  StudyOverviewSiteBreakdownQuery,
  StudyOverviewSiteBreakdownResult,
} from "@/lib/study-overview-site-breakdown-types";

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

const normalizeSiteStatus = (value: unknown): SiteRow["status"] => {
  const normalized = toStringOrNull(value)?.toUpperCase().replace(/\s+/g, "_");
  if (normalized === "ENROLLING") return "ENROLLING";
  if (normalized === "ON_HOLD") return "ON HOLD";
  if (normalized === "SCREENING") return "SCREENING";
  if (normalized === "CLOSED") return "CLOSED";
  return "ENROLLING";
};

const mapSite = (site: StudyOverviewSiteBreakdownApiSite, index: number): SiteRow => {
  const target = toFiniteNumber(site.target) ?? 0;
  const actual = toFiniteNumber(site.actual) ?? 0;
  const rawPct = toFiniteNumber(site["%Enrolled"]) ?? toFiniteNumber(site.percentEnrolled);
  const details = isRecord(site.details) ? site.details : null;
  const screeningFunnel = isRecord(site.screeningFunnel) ? site.screeningFunnel : null;
  const hasDetails = !!details;
  const hasScreeningFunnel = !!screeningFunnel;
  const mappedDetails = hasDetails
    ? {
        siteId: toStringOrNull(details?.siteId) ?? undefined,
        country: toStringOrNull(details?.country) ?? undefined,
        status: normalizeSiteStatus(details?.status),
        activatedOn: toStringOrNull(details?.activatedOn) ?? null,
        pi: toStringOrNull(details?.pi) ?? null,
      }
    : undefined;
  const mappedScreeningFunnel = hasScreeningFunnel
    ? {
        totalScreened: toFiniteNumber(screeningFunnel?.totalScreened) ?? 0,
        screenFailure: toFiniteNumber(screeningFunnel?.screenFailure) ?? 0,
        enrolled: toFiniteNumber(screeningFunnel?.enrolled) ?? actual,
        target: toFiniteNumber(screeningFunnel?.target) ?? target,
        percentEnrolled:
          toFiniteNumber(screeningFunnel?.["%Enrolled"]) ??
          toFiniteNumber(screeningFunnel?.percentEnrolled) ??
          (target > 0 ? (actual / target) * 100 : 0),
      }
    : undefined;

  return {
    id: toStringOrNull(site.siteId) ?? `SITE-${index + 1}`,
    name: toStringOrNull(site.siteName) ?? `Site ${index + 1}`,
    country: toStringOrNull(site.country) ?? "Unknown",
    target,
    actual,
    pct: rawPct == null ? (target > 0 ? (actual / target) * 100 : 0) : normalizePercent(rawPct),
    status: normalizeSiteStatus(site.siteStatus ?? site.status),
    details: mappedDetails,
    screeningFunnel: mappedScreeningFunnel,
  };
};

const mapPayload = (
  payload: StudyOverviewSiteBreakdownApiResponse,
  query: StudyOverviewSiteBreakdownQuery,
): StudyOverviewSiteBreakdownData => {
  const rawSites = toArrayRecords<StudyOverviewSiteBreakdownApiSite>(payload.sites);
  const mappedSites = rawSites.map((site, index) => mapSite(site, index));

  return {
    sites: mappedSites,
    timeHorizonLabel: toStringOrNull(payload.timeHorizon) ?? toTimeHorizonLabel(query.timeHorizon),
    window: {
      startDate: toStringOrNull(payload.window?.startDate) ?? null,
      endDate: toStringOrNull(payload.window?.endDate) ?? null,
    },
  };
};

async function fetchSiteBreakdown(
  query: StudyOverviewSiteBreakdownQuery,
  signal?: AbortSignal,
): Promise<StudyOverviewSiteBreakdownApiResponse> {
  const params = new URLSearchParams({
    timeHorizon: toTimeHorizonLabel(query.timeHorizon),
    studyId: query.studyId,
  });
  const path = `/api/v1/study-overview/breakdown/sites?${params.toString()}`;
  const response = await fetch(
    withApiBaseUrl(path, path),
    withApiRequestConfig({ method: "GET", signal }),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch site breakdown: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected site breakdown API response shape");
  }

  return payload as StudyOverviewSiteBreakdownApiResponse;
}

export const studyOverviewSiteBreakdownService = {
  async getSiteBreakdown(
    query: StudyOverviewSiteBreakdownQuery,
    signal?: AbortSignal,
  ): Promise<StudyOverviewSiteBreakdownResult> {
    try {
      const payload = await fetchSiteBreakdown(query, signal);
      return {
        data: mapPayload(payload, query),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load site breakdown from API");

      return {
        data: {
          sites: [],
          timeHorizonLabel: toTimeHorizonLabel(query.timeHorizon),
          window: {
            startDate: null,
            endDate: null,
          },
        },
        source: "api",
        error: normalizedError,
      };
    }
  },
};
