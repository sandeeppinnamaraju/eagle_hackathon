import type { ProtocolResult } from "@/lib/data";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";

// ── Request / Response types ──────────────────────────────────────────────────

export interface ProtocolSearchRequest {
  summary: string;
  inclusion_criteria?: string;
  exclusion_criteria?: string;
  therapeutic_areas?: string[];
  top_k?: number;
}

interface ProtocolSearchApiItem {
  rank?: number;
  protocol_id?: string;
  id?: string;
  phase?: string;
  therapeutic_area?: string;
  category?: string;
  title?: string;
  indication?: string;
  summary_bullets?: string[];
  bullets?: string[];
  inclusion_preview?: string[] | string;
  inclusionPreview?: string[] | string;
  inclusion_criteria_preview?: string[] | string;
  inclusionCriteriaPreview?: string[] | string;
  inclusion_criteria?: string[] | string;
  /** Similarity score expressed as a value in [0, 1] or [0, 100]. */
  similarity_score?: number;
  match?: number;
}

interface ProtocolSearchApiResponse {
  results?: ProtocolSearchApiItem[];
}

// ── Mapping helper ────────────────────────────────────────────────────────────

function normalizeMatchScore(raw: number): number {
  // API may return 0–1 or 0–100; normalise to 0–100 integer.
  const score = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
  return Math.min(100, Math.max(0, score));
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }

  return [];
}

function pickFirstNonEmptyArray(...values: unknown[]): string[] {
  for (const value of values) {
    const items = toStringArray(value);
    if (items.length > 0) return items;
  }

  return [];
}

function normalizeInclusionPreviewItems(items: string[]): string[] {
  return items.map((item) =>
    item
      .replace(/^(?:\s*(?:\d+[.)]\s+|[-*•]\s+))+/, "")
      .trim(),
  );
}

function mapApiItemToProtocolResult(item: ProtocolSearchApiItem, fallbackRank: number): ProtocolResult {
  const rawMatch = item.similarity_score ?? item.match ?? 0;
  const inclusionBullets = pickFirstNonEmptyArray(
    item.summary_bullets,
    item.inclusion_preview,
    item.inclusionPreview,
    item.inclusion_criteria_preview,
    item.inclusionCriteriaPreview,
    item.inclusion_criteria,
    item.bullets,
  );

  return {
    rank: typeof item.rank === "number" ? item.rank : fallbackRank,
    id: item.protocol_id ?? item.id ?? `result-${fallbackRank}`,
    phase: normalizePhase(item.phase),
    category: item.therapeutic_area ?? item.category ?? "",
    title: item.title ?? "",
    indication: item.indication ?? "",
    bullets: normalizeInclusionPreviewItems(inclusionBullets),
    match: normalizeMatchScore(rawMatch),
  };
}

function normalizePhase(raw: string | undefined): ProtocolResult["phase"] {
  if (!raw) return undefined;
  const upper = raw.toUpperCase().replace(/[\s-]+/g, " ").trim();
  if (upper.includes("III")) return "PHASE III";
  if (upper.includes("II")) return "PHASE II";
  if (upper.includes("I")) return "PHASE I";
  return undefined;
}

// ── API call ──────────────────────────────────────────────────────────────────

const SEARCH_PROTOCOLS_PATH = "/api/search-protocols";
const SEARCH_PROTOCOLS_FALLBACK_URL = "/api/search-protocols";

export async function searchProtocols(
  request: ProtocolSearchRequest,
  signal?: AbortSignal,
): Promise<ProtocolResult[] | null> {
  const response = await fetch(
    withApiBaseUrl(SEARCH_PROTOCOLS_PATH, SEARCH_PROTOCOLS_FALLBACK_URL),
    withApiRequestConfig({
      method: "POST",
      body: JSON.stringify(request),
      signal,
    }),
  );

  if (!response.ok) {
    throw new Error(`Protocol search failed: ${response.status}`);
  }

  const payload = (await response.json()) as ProtocolSearchApiResponse | ProtocolSearchApiItem[] | null;

  if (!payload) return null;

  // Handle both wrapped { results: [...] } and bare array responses.
  const items: ProtocolSearchApiItem[] = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload.results) ? payload.results : []);

  if (items.length === 0) return null;

  return items.map((item, i) => mapApiItemToProtocolResult(item, i + 1));
}
