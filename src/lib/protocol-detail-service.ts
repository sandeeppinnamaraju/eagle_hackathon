import {
  DETAIL_ENROLLMENT,
  DETAIL_EXCLUSION_ITEMS,
  DETAIL_INCLUSION_ITEMS,
  DETAIL_SITES,
} from "@/components/protocol-search/constants";
import type { SiteRow } from "@/components/protocol-search/types";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import { protocolResults, type ProtocolResult } from "@/lib/data";
import type {
  ProtocolDetailApiResponse,
  ProtocolDetailData,
  ProtocolDetailResult,
} from "@/lib/protocol-detail-types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringOr = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const toTrimmedStringOrNull = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const toNumberOr = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toStringArrayOr = (value: unknown, fallback: string[]): string[] =>
  Array.isArray(value) ? value.filter((it): it is string => typeof it === "string" && it.trim().length > 0) : fallback;

const toCriteriaArrayOr = (value: unknown, fallback: string[]): string[] => {
  if (Array.isArray(value)) {
    return value.filter((it): it is string => typeof it === "string" && it.trim().length > 0);
  }

  const text = toTrimmedStringOrNull(value);
  if (!text) return fallback;

  const parsed = text
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length > 0);

  return parsed.length > 0 ? parsed : fallback;
};

const pickFirstStringOr = (fallback: string, ...values: unknown[]): string => {
  for (const value of values) {
    const normalized = toTrimmedStringOrNull(value);
    if (normalized) return normalized;
  }

  return fallback;
};

const toIsoDateOr = (fallback: string, ...values: unknown[]): string => {
  const raw = pickFirstStringOr("", ...values);
  if (!raw) return fallback;

  const datePrefixMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (datePrefixMatch) return datePrefixMatch[1];

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return fallback;

  return parsed.toISOString().slice(0, 10);
};

const toDurationOr = (fallback: string, ...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return `${value} mo`;
    }

    const normalized = toTrimmedStringOrNull(value);
    if (normalized) return normalized;
  }

  return fallback;
};

const firstRecord = (...values: unknown[]): Record<string, unknown> => {
  for (const value of values) {
    if (isRecord(value)) return value;
  }

  return {};
};

const collectInsightItems = (...values: unknown[]): Record<string, unknown>[] => {
  const items: Record<string, unknown>[] = [];

  for (const value of values) {
    if (!Array.isArray(value)) continue;

    for (const item of value) {
      if (isRecord(item)) items.push(item);
    }
  }

  return items;
};

const findInsightMessage = (
  entries: Record<string, unknown>[],
  matcher: (type: string, title: string) => boolean,
): string | null => {
  for (const entry of entries) {
    const type = (toTrimmedStringOrNull(entry.type) ?? "").toLowerCase();
    const title = (toTrimmedStringOrNull(entry.title) ?? "").toLowerCase();
    if (!matcher(type, title)) continue;

    const message = pickFirstStringOr(
      "",
      entry.message,
      entry.recommendation,
      entry.value,
      entry.description,
      entry.text,
    );
    if (message) return message;
  }

  return null;
};

function normalizePhase(raw: unknown): ProtocolResult["phase"] {
  if (typeof raw !== "string") return undefined;
  const upper = raw.toUpperCase().replace(/[\s-]+/g, " ").trim();
  if (upper.includes("III")) return "PHASE III";
  if (upper.includes("II")) return "PHASE II";
  if (upper.includes("I")) return "PHASE I";
  return undefined;
}

function toSiteRow(raw: unknown): SiteRow | null {
  if (!isRecord(raw)) return null;

  const name = toStringOr(raw.name ?? raw.site_name, "");
  const country = toStringOr(raw.country ?? raw.site_country, "");
  if (!name || !country) return null;

  return {
    name,
    country,
    target: toNumberOr(raw.target ?? raw.target_enrollment, 0),
    actual: toNumberOr(raw.actual ?? raw.actual_enrollment, 0),
    planned: toNumberOr(raw.planned ?? raw.planned_duration_months, 0),
    actualMo: toNumberOr(raw.actualMo ?? raw.actual_months ?? raw.actual_duration_months, 0),
    siteType: typeof raw.siteType === "string" ? raw.siteType : typeof raw.site_type === "string" ? raw.site_type : null,
    archetype: typeof raw.archetype === "string" ? raw.archetype : null,
  };
}

function getDefaultResult(protocolId: string): ProtocolResult {
  return (
    protocolResults.find((item) => item.id === protocolId) ?? {
      rank: 1,
      id: protocolId,
      phase: undefined,
      category: "",
      title: "Protocol details",
      indication: "",
      bullets: [],
      match: 0,
    }
  );
}

function getDefaultData(protocolId: string): ProtocolDetailData {
  const base = getDefaultResult(protocolId);

  return {
    result: base,
    therapeuticArea: base.category,
    summary:
      "Protocol details are currently unavailable. Showing baseline view while data is being refreshed.",
    plannedStart: "-",
    actualEnd: "-",
    plannedDuration: "-",
    actualDuration: "-",
    inclusionItems: [...DETAIL_INCLUSION_ITEMS],
    exclusionItems: [...DETAIL_EXCLUSION_ITEMS],
    enrollment: {
      enrolled: DETAIL_ENROLLMENT.enrolled,
      target: DETAIL_ENROLLMENT.target,
    },
    sites: [...DETAIL_SITES],
    insights: {
      enrollmentRisk: "-",
      recommendation: "-",
      comparableTrials: "-",
      operationalSignal: "-",
    },
    lessonLearned:
      "Protocol detail API data is unavailable, so baseline lessons are shown to keep the page usable.",
  };
}

function mapProtocolDetailPayload(
  protocolId: string,
  payload: ProtocolDetailApiResponse,
): ProtocolDetailData {
  const fallback = getDefaultData(protocolId);

  const protocolNode = isRecord(payload.protocol)
    ? payload.protocol
    : isRecord(payload.protocol_details)
      ? payload.protocol_details
      : {};

  const kpiNode = isRecord(payload.kpis)
    ? payload.kpis
    : isRecord(payload.enrollment)
      ? payload.enrollment
      : {};

  const criteriaNode = isRecord(payload.criteria) ? payload.criteria : {};
  const protocolInsightNode = firstRecord(protocolNode.ai_insights, protocolNode.insights);
  const insightNode = firstRecord(
    payload.ai_insights,
    payload.insights,
    payload.api_insights,
    payload.aiInsights,
    protocolInsightNode,
  );
  const insightEntries = collectInsightItems(
    payload.ai_insights,
    payload.insights,
    payload.api_insights,
    payload.aiInsights,
    protocolNode.ai_insights,
    protocolNode.insights,
  );

  const arrayInsightNode = {
    enrollment_risk: findInsightMessage(
      insightEntries,
      (type, title) =>
        type === "risk" || title.includes("enrollment") || title.includes("recruitment"),
    ),
    recommendation: findInsightMessage(
      insightEntries,
      (type, title) =>
        type === "recommendation" ||
        type === "action" ||
        type === "suggestion" ||
        title.includes("recommend"),
    ),
    comparable_trials: findInsightMessage(
      insightEntries,
      (type, title) =>
        type === "info" ||
        title.includes("historical") ||
        title.includes("comparable") ||
        title.includes("benchmark") ||
        title.includes("trial"),
    ),
    operational_signal: findInsightMessage(
      insightEntries,
      (type, title) =>
        type === "warning" ||
        title.includes("site") ||
        title.includes("operational") ||
        title.includes("performance") ||
        title.includes("concentration"),
    ),
  };

  const result: ProtocolResult = {
    ...fallback.result,
    id: toStringOr(protocolNode.protocol_id ?? protocolNode.id, fallback.result.id),
    title: toStringOr(protocolNode.title ?? protocolNode.protocol_title, fallback.result.title),
    indication: toStringOr(protocolNode.indication, fallback.result.indication),
    category: toStringOr(
      protocolNode.therapeutic_area ?? protocolNode.category,
      fallback.result.category,
    ),
    phase: normalizePhase(protocolNode.phase) ?? fallback.result.phase,
  };

  const mappedSites = Array.isArray(payload.sites)
    ? payload.sites.map(toSiteRow).filter((site): site is SiteRow => site !== null)
    : [];

  return {
    result,
    therapeuticArea: toStringOr(
      protocolNode.therapeutic_area ?? protocolNode.category,
      fallback.therapeuticArea,
    ),
    summary: toStringOr(
      protocolNode.full_summary ?? protocolNode.summary ?? protocolNode.description,
      fallback.summary,
    ),
    plannedStart: toIsoDateOr(
      fallback.plannedStart,
      protocolNode.planned_start_date,
      protocolNode.plannedStartDate,
      protocolNode.planned_start,
      protocolNode.plannedStart,
      protocolNode.start_date,
      protocolNode.startDate,
    ),
    actualEnd: toIsoDateOr(
      fallback.actualEnd,
      protocolNode.actual_end_date,
      protocolNode.actualEndDate,
      protocolNode.actual_end,
      protocolNode.actualEnd,
      protocolNode.end_date,
      protocolNode.endDate,
    ),
    plannedDuration: toDurationOr(
      fallback.plannedDuration,
      protocolNode.planned_duration_months,
      protocolNode.plannedDurationMonths,
      protocolNode.planned_duration,
      protocolNode.plannedDuration,
      protocolNode.duration_months,
      protocolNode.durationMonths,
      protocolNode.duration,
    ),
    actualDuration: toDurationOr(
      fallback.actualDuration,
      protocolNode.actual_duration_months,
      protocolNode.actualDurationMonths,
      protocolNode.actual_duration,
      protocolNode.actualDuration,
      protocolNode.duration_months,
      protocolNode.durationMonths,
      protocolNode.duration,
    ),
    inclusionItems: toCriteriaArrayOr(
      criteriaNode.inclusion ?? criteriaNode.inclusion_criteria ?? protocolNode.inclusion_criteria,
      fallback.inclusionItems,
    ),
    exclusionItems: toCriteriaArrayOr(
      criteriaNode.exclusion ?? criteriaNode.exclusion_criteria ?? protocolNode.exclusion_criteria,
      fallback.exclusionItems,
    ),
    enrollment: {
      enrolled: toNumberOr(
        kpiNode.enrolled ?? kpiNode.actual ?? kpiNode.actual_enrollment,
        fallback.enrollment.enrolled,
      ),
      target: toNumberOr(
        kpiNode.target ?? kpiNode.target_enrollment,
        fallback.enrollment.target,
      ),
    },
    sites: mappedSites.length > 0 ? mappedSites : fallback.sites,
    insights: {
      enrollmentRisk: pickFirstStringOr(
        fallback.insights.enrollmentRisk,
        insightNode.enrollment_risk,
        insightNode.enrollmentRisk,
        insightNode.risk,
        arrayInsightNode.enrollment_risk,
      ),
      recommendation: pickFirstStringOr(
        fallback.insights.recommendation,
        insightNode.recommendation,
        insightNode.recommendations,
        insightNode.recommended_action,
        insightNode.recommendedAction,
        arrayInsightNode.recommendation,
      ),
      comparableTrials: pickFirstStringOr(
        fallback.insights.comparableTrials,
        insightNode.comparable_trials,
        insightNode.comparableTrials,
        insightNode.similar_trials,
        insightNode.similarTrials,
        insightNode.benchmark_trials,
        insightNode.benchmarkTrials,
        arrayInsightNode.comparable_trials,
      ),
      operationalSignal: pickFirstStringOr(
        fallback.insights.operationalSignal,
        insightNode.operational_signal,
        insightNode.operationalSignal,
        insightNode.operations_signal,
        insightNode.operational_risk,
        insightNode.operationalRisk,
        arrayInsightNode.operational_signal,
      ),
    },
    lessonLearned: toStringOr(
      payload.lessons_learned ?? payload.lesson_learned ?? protocolNode.lessons_learned,
      fallback.lessonLearned,
    ),
  };
}

async function fetchProtocolDetailFromApi(
  protocolId: string,
  signal?: AbortSignal,
): Promise<ProtocolDetailData> {
  const encodedProtocolId = encodeURIComponent(protocolId);
  const response = await fetch(
    withApiBaseUrl(`/api/protocol/${encodedProtocolId}`, `/api/protocol/${encodedProtocolId}`),
    withApiRequestConfig({
      method: "GET",
      signal,
    }),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch protocol detail: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected protocol detail API response shape");
  }

  return mapProtocolDetailPayload(protocolId, payload as ProtocolDetailApiResponse);
}

export const protocolDetailService = {
  async getProtocolDetail(protocolId: string, signal?: AbortSignal): Promise<ProtocolDetailResult> {
    try {
      const data = await fetchProtocolDetailFromApi(protocolId, signal);
      return {
        data,
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load protocol details from API");

      return {
        data: getDefaultData(protocolId),
        source: "mock",
        error: normalizedError,
      };
    }
  },
};
