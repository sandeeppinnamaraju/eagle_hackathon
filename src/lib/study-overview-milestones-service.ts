import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";
import type {
  StudyOverviewMilestoneRow,
  StudyOverviewMilestonesApiItem,
  StudyOverviewMilestonesApiResponse,
  StudyOverviewMilestonesData,
  StudyOverviewMilestonesQuery,
  StudyOverviewMilestonesResult,
} from "@/lib/study-overview-milestones-types";

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

const parseDateString = (value: string): Date | null => {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: Date): string =>
  value.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const toDisplayDate = (value: unknown): string => {
  const raw = toStringOrNull(value);
  if (!raw) return "—";
  const parsed = parseDateString(raw);
  return parsed ? formatDate(parsed) : raw;
};

const fallbackData = (query: StudyOverviewMilestonesQuery): StudyOverviewMilestonesData => ({
  studyId: query.studyId,
  milestones: query.fallbackRows,
});

const mapItem = (item: StudyOverviewMilestonesApiItem, index: number): StudyOverviewMilestoneRow => {
  const code = toStringOrNull(item.code) ?? `M${index + 1}`;
  const label = toStringOrNull(item.milestone) ?? toStringOrNull(item.label) ?? `Milestone ${index + 1}`;

  return {
    code,
    label,
    planned: toDisplayDate(item.planned),
    actual: toDisplayDate(item.actual),
    apiVarianceText: toStringOrNull(item.variance),
    apiVarianceDays: toFiniteNumber(item.varianceDays) ?? toFiniteNumber(item.variance_days),
  };
};

const mapPayload = (payload: StudyOverviewMilestonesApiResponse, query: StudyOverviewMilestonesQuery): StudyOverviewMilestonesData => {
  const milestonesRaw = toArrayRecords<StudyOverviewMilestonesApiItem>(payload.milestones);

  if (milestonesRaw.length === 0) {
    return fallbackData(query);
  }

  return {
    studyId: toStringOrNull(payload.studyId) ?? query.studyId,
    milestones: milestonesRaw.map(mapItem),
  };
};

async function fetchMilestones(
  query: StudyOverviewMilestonesQuery,
  signal?: AbortSignal,
): Promise<StudyOverviewMilestonesApiResponse> {
  const params = new URLSearchParams({ studyId: query.studyId });
  const path = `/api/study-overview/charts/milestones?${params.toString()}`;
  const response = await fetch(withApiBaseUrl(path, path), withApiRequestConfig({ method: "GET", signal }));

  if (!response.ok) {
    throw new Error(`Failed to fetch study milestones: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!isRecord(payload)) {
    throw new Error("Unexpected milestones API response shape");
  }

  return payload as StudyOverviewMilestonesApiResponse;
}

export const studyOverviewMilestonesService = {
  async getMilestones(
    query: StudyOverviewMilestonesQuery,
    signal?: AbortSignal,
  ): Promise<StudyOverviewMilestonesResult> {
    try {
      const payload = await fetchMilestones(query, signal);
      return {
        data: mapPayload(payload, query),
        source: "api",
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to load milestones from API");

      return {
        data: fallbackData(query),
        source: "fallback",
        error: normalizedError,
      };
    }
  },
};