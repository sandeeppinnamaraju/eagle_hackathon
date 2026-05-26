import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { protocolResults as localProtocolResults, studies as localStudies } from "./lib/data";
import { sortStudies, type StudySortDirection, type StudySortKey } from "./lib/study-sorting";
import { getStudyDates } from "./lib/study-derived";

const getStudyRegion = (countries: number): string => {
  if (countries >= 6) return "Global";
  if (countries >= 3) return "Multi-country";
  return "Local";
};

const parsePositiveInt = (rawValue: string | null, fallback: number): number => {
  if (!rawValue) return fallback;
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toSafePercentage = (numerator: number, denominator: number): number => {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
};

const parseIsoDateParam = (value: string | null): Date | null => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  if (!isValid) return null;
  return parsed;
};

function applyStudyFilters(url: URL) {
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
  const therapeuticAreas = url.searchParams.getAll("therapeuticArea");
  const phase = url.searchParams.get("phase");
  const status = url.searchParams.get("status");
  const portfolio = url.searchParams.get("portfolio");
  const program = url.searchParams.get("program");
  const region = url.searchParams.get("region");
  const fpiStartDate = parseIsoDateParam(url.searchParams.get("fpiStartDate"));
  const fpiEndDate = parseIsoDateParam(url.searchParams.get("fpiEndDate"));
  const lpoStartDate = parseIsoDateParam(url.searchParams.get("lpoStartDate"));
  const lpoEndDate = parseIsoDateParam(url.searchParams.get("lpoEndDate"));

  return localStudies.filter((study) => {
    const searchMatch =
      search.length === 0 ||
      study.id.toLowerCase().includes(search) ||
      study.title.toLowerCase().includes(search) ||
      study.indication.toLowerCase().includes(search) ||
      study.therapeuticArea.toLowerCase().includes(search);

    const therapeuticAreaMatch =
      therapeuticAreas.length === 0 || therapeuticAreas.includes(study.therapeuticArea);
    const phaseMatch = !phase || study.phase === phase;
    const statusMatch = !status || study.status === status;
    const portfolioMatch = !portfolio || study.portfolio === portfolio;
    const programMatch = !program || study.program === program;
    const regionMatch = !region || getStudyRegion(study.countries) === region;
    const studyDates = getStudyDates(study);
    const fpiDate = studyDates.actualFPI ?? studyDates.plannedFPI;
    const lpoDate = studyDates.forecastLPO ?? studyDates.plannedLPO;
    const fpiMatch =
      (!fpiStartDate || fpiDate >= fpiStartDate) &&
      (!fpiEndDate || fpiDate <= fpiEndDate);
    const lpoMatch =
      (!lpoStartDate || lpoDate >= lpoStartDate) &&
      (!lpoEndDate || lpoDate <= lpoEndDate);

    return (
      searchMatch &&
      therapeuticAreaMatch &&
      phaseMatch &&
      statusMatch &&
      portfolioMatch &&
      programMatch &&
      regionMatch &&
      fpiMatch &&
      lpoMatch
    );
  });
}

function buildKpiDetailsPayload(url: URL) {
  const filtered = applyStudyFilters(url);
  const activeStudies = filtered.filter((study) => study.status === "Recruiting" || study.status === "Follow-up");
  const onTrackCount = activeStudies.filter((study) => study.performance === "On Track").length;
  const offTrackOrAtRiskCount = activeStudies.filter(
    (study) => study.performance === "Off Track" || study.performance === "At Risk",
  ).length;

  const totalActual = activeStudies.reduce((sum, study) => sum + study.actual, 0);
  const totalTarget = activeStudies.reduce((sum, study) => sum + study.target, 0);
  const studiesWithPlan = activeStudies.filter((study) => typeof study.percentVsPlan === "number");
  const avgPercentVsPlan =
    studiesWithPlan.length === 0
      ? 0
      : Number(
        (
          studiesWithPlan.reduce((sum, study) => sum + (study.percentVsPlan ?? 0), 0) /
          studiesWithPlan.length
        ).toFixed(2),
      );

  return {
    active_studies: {
      count: activeStudies.length,
    },
    on_track: {
      percentage: toSafePercentage(onTrackCount, activeStudies.length),
      count: onTrackCount,
    },
    off_track_or_at_risk: {
      percentage: toSafePercentage(offTrackOrAtRiskCount, activeStudies.length),
      count: offTrackOrAtRiskCount,
    },
    enrollment_vs_target: {
      percentage: toSafePercentage(totalActual, totalTarget),
      sum_actual: totalActual,
      sum_target: totalTarget,
    },
    schedule_adherence: {
      percentage: avgPercentVsPlan,
      actual_enrollment: totalActual,
      planned_enrollment: totalTarget,
    },
    velocity_vs_plan: {
      average: avgPercentVsPlan,
    },
  };
}

function buildStudiesPagePayload(url: URL) {
  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const limit = parsePositiveInt(url.searchParams.get("limit"), 200);
  const sortBy = url.searchParams.get("sortBy") as StudySortKey | null;
  const sortOrder = (url.searchParams.get("sortOrder") as StudySortDirection | null) ?? "asc";

  let filtered = applyStudyFilters(url);
  if (sortBy) {
    filtered = sortStudies(filtered, sortBy, sortOrder);
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  return {
    items,
    page,
    limit,
    total,
    hasMore: startIndex + items.length < total,
  };
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/study-protocol/studies") {
      return new Response(JSON.stringify(buildStudiesPagePayload(url)), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (request.method === "GET" && url.pathname === "/api/study-protocol/kpi-details") {
      return new Response(JSON.stringify(buildKpiDetailsPayload(url)), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (request.method === "GET" && url.pathname === "/api/studies") {
      return new Response(JSON.stringify(localStudies), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (request.method === "GET" && url.pathname === "/api/protocol-results") {
      return new Response(JSON.stringify(localProtocolResults), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
