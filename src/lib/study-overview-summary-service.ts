import type { StudyOverviewContentProps } from "@/components/study-overview/types";
import type { Performance, Priority, Status, Study } from "@/lib/data";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type {
  StudyOverviewSummaryApiResponse,
  StudyOverviewSummaryData,
  StudyOverviewSummaryResult,
} from "@/lib/study-overview-summary-types";

type StudyDetail = StudyOverviewContentProps["detail"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toTrimmedString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const toTextValue = (value: unknown): string | null => {
  const direct = toTrimmedString(value);
  if (direct) return direct;

  if (isRecord(value)) {
    return toTrimmedString(value.value);
  }

  return null;
};

const firstString = (fallback: string, ...values: unknown[]): string => {
  for (const value of values) {
    const normalized = toTextValue(value);
    if (normalized) return normalized;
  }

  return fallback;
};

const firstNumber = (fallback: number, ...values: unknown[]): number => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
};

const normalizePhase = (value: string | null, fallback: Study["phase"]): Study["phase"] => {
  if (!value) return fallback;
  const upper = value.toUpperCase().replace(/[\s_-]+/g, " ").trim();
  if (upper.includes("IV") || upper.includes("4")) return "Ph IV";
  if (upper.includes("III") || upper.includes("3")) return "Ph III";
  if (upper.includes("II") || upper.includes("2")) return "Ph II";
  if (upper.includes("I") || upper.includes("1")) return "Ph I";
  return fallback;
};

const normalizeStatus = (value: string | null, fallback: Status): Status => {
  if (!value) return fallback;
  const normalized = value.toLowerCase().replace(/[_-]+/g, " ");
  if (normalized.includes("recruit")) return "Recruiting";
  if (normalized.includes("plan")) return "Planned";
  if (normalized.includes("follow")) return "Follow-up";
  return fallback;
};

const normalizePriority = (value: string | null, fallback: Priority): Priority => {
  if (!value) return fallback;
  const normalized = value.toLowerCase();
  if (normalized.includes("high")) return "High";
  if (normalized.includes("medium")) return "Medium";
  if (normalized.includes("low")) return "Low";
  return fallback;
};

const normalizePerformance = (value: string | null, fallback: Performance): Performance => {
  if (!value) return fallback;
  const normalized = value.toLowerCase().replace(/[_-]+/g, " ");
  if (normalized.includes("on track")) return "On Track";
  if (normalized.includes("risk")) return "At Risk";
  if (normalized.includes("off track")) return "Off Track";
  if (normalized === "-" || normalized === "--" || normalized === "n/a") return "—";
  return fallback;
};

const getNested = (record: Record<string, unknown>, key: string): unknown => {
  const parts = key.split(".");
  let current: unknown = record;

  for (const part of parts) {
    if (!isRecord(current)) return undefined;
    current = current[part];
  }

  return current;
};

const pickValue = (node: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    const value = getNested(node, key);
    if (value != null) return value;
  }

  return undefined;
};

const pickRecord = (...values: unknown[]): Record<string, unknown> => {
  for (const value of values) {
    if (isRecord(value)) return value;
  }

  return {};
};

function mapSummaryPayload(
  payload: StudyOverviewSummaryApiResponse,
  fallback: StudyOverviewSummaryData,
): StudyOverviewSummaryData {
  const root = isRecord(payload) ? payload : {};
  const summaryNode = pickRecord(root.summary, root.studySummary, root.study_summary);
  const studyNode = pickRecord(root.study, summaryNode.study, summaryNode.studyDetails, summaryNode.study_details, root);
  const detailNode = pickRecord(root.detail, root.details, summaryNode.detail, summaryNode.details, root);
  const sponsorNode = pickRecord(
    studyNode.sponsor,
    detailNode.sponsor,
    root.sponsor,
    root,
  );
  const milestoneNode = pickRecord(
    studyNode.milestones,
    detailNode.milestones,
    root.milestones,
  );

  const mappedStudy: Study = {
    ...fallback.study,
    id: firstString(fallback.study.id, pickValue(studyNode, ["id", "studyId", "study_id"])),
    title: firstString(
      fallback.study.title,
      pickValue(studyNode, ["title", "studyTitle", "study_title"]),
      pickValue(root, ["title", "studyTitle", "study_title"]),
    ),
    phase: normalizePhase(
      toTrimmedString(pickValue(studyNode, ["phase", "studyPhase", "study_phase"])),
      fallback.study.phase,
    ),
    status: normalizeStatus(
      toTrimmedString(pickValue(studyNode, ["status", "studyStatus", "study_status"])),
      fallback.study.status,
    ),
    priority: normalizePriority(
      toTrimmedString(pickValue(studyNode, ["priority", "studyPriority", "study_priority"])),
      fallback.study.priority,
    ),
    performance: normalizePerformance(
      toTrimmedString(pickValue(studyNode, ["performance", "performanceStatus", "performance_status"])),
      fallback.study.performance,
    ),
    portfolio: firstString(
      fallback.study.portfolio,
      pickValue(studyNode, ["portfolio", "portfolioName", "portfolio_name"]),
    ),
    indication: firstString(
      fallback.study.indication,
      pickValue(studyNode, ["indication", "studyIndication", "study_indication"]),
    ),
    therapeuticArea: firstString(
      fallback.study.therapeuticArea,
      pickValue(studyNode, ["therapeuticArea", "therapeutic_area"]),
    ),
    program: firstString(
      fallback.study.program,
      pickValue(studyNode, ["program", "asset", "assetName", "asset_name"]),
      pickValue(detailNode, ["asset", "assetName", "asset_name"]),
    ),
  };

  const mappedDetail: StudyDetail = {
    ...fallback.detail,
    asset: firstString(
      fallback.detail.asset,
      pickValue(detailNode, ["asset", "assetName", "asset_name"]),
      mappedStudy.program,
    ),
    assetLead: firstString(
      fallback.detail.assetLead,
      pickValue(detailNode, ["assetLead", "asset_lead"]),
    ),
    fsoModel: firstString(
      fallback.detail.fsoModel,
      pickValue(detailNode, ["fsoModel", "fso_model"]),
    ),
    sponsor: firstString(
      fallback.detail.sponsor,
      pickValue(sponsorNode, ["name", "sponsorName", "sponsor_name", "studySponsor", "study_sponsor"]),
      pickValue(detailNode, ["sponsor", "sponsorName", "sponsor_name", "studySponsor", "study_sponsor"]),
    ),
    designation: firstString(
      fallback.detail.designation,
      pickValue(detailNode, ["designation", "studyDesignation", "study_designation"]),
    ),
    plannedFPI: firstString(
      fallback.detail.plannedFPI,
      pickValue(milestoneNode, ["plannedFPI", "plannedFpi", "planned_fpi", "fpiPlanned", "fpi_planned"]),
      pickValue(detailNode, ["plannedFPI", "plannedFpi", "planned_fpi"]),
    ),
    actualFPI: firstString(
      fallback.detail.actualFPI,
      pickValue(milestoneNode, ["actualFPI", "actualFpi", "actual_fpi", "fpiActual", "fpi_actual"]),
      pickValue(detailNode, ["actualFPI", "actualFpi", "actual_fpi"]),
    ),
    plannedLPI: firstString(
      fallback.detail.plannedLPI,
      pickValue(milestoneNode, ["plannedLPO", "plannedLpo", "planned_lpo", "plannedLPI", "planned_lpi", "lpoPlanned", "lpo_planned"]),
      pickValue(detailNode, ["plannedLPO", "plannedLpo", "planned_lpo", "plannedLPI", "planned_lpi"]),
    ),
    forecastLPI: firstString(
      fallback.detail.forecastLPI,
      pickValue(milestoneNode, ["forecastLPO", "forecastLpo", "forecast_lpo", "forecastLPI", "forecast_lpi", "lpoForecast", "lpo_forecast"]),
      pickValue(detailNode, ["forecastLPO", "forecastLpo", "forecast_lpo", "forecastLPI", "forecast_lpi"]),
    ),
    targetEnrollment: firstNumber(
      fallback.detail.targetEnrollment,
      pickValue(detailNode, ["targetEnrollment", "target_enrollment"]),
      pickValue(studyNode, ["targetEnrollment", "target_enrollment", "target"]),
    ),
  };

  return {
    study: mappedStudy,
    detail: mappedDetail,
  };
}

async function fetchSummaryFromApi(studyId: string, signal?: AbortSignal): Promise<StudyOverviewSummaryApiResponse> {
  const encodedStudyId = encodeURIComponent(studyId);
  const endpoint = `/api/study-overview/summary?studyId=${encodedStudyId}`;
  const fallbackEndpoint = `/api/study-overview/summary?studyId=${encodedStudyId}`;
  const response = await fetch(
    withApiBaseUrl(endpoint, fallbackEndpoint),
    withApiRequestConfig({ method: "GET", signal }),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch study overview summary: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected study overview summary API response shape");
  }

  return payload;
}

export const studyOverviewSummaryService = {
  async getSummary(
    studyId: string,
    fallback: StudyOverviewSummaryData,
    signal?: AbortSignal,
  ): Promise<StudyOverviewSummaryResult> {
    try {
      const payload = await fetchSummaryFromApi(studyId, signal);
      return {
        data: mapSummaryPayload(payload, fallback),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load study overview summary from API");

      return {
        data: fallback,
        source: "fallback",
        error: normalizedError,
      };
    }
  },
};
