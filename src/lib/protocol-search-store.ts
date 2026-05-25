import type { ProtocolSearchRequest } from "@/lib/protocol-search-api";

const SESSION_KEY = "protocol_search_params";

const DEFAULT_TOP_K = 10;

/**
 * In-memory cache so that the current page session doesn't depend on
 * sessionStorage being available (e.g. private-browsing restrictions).
 */
let memoryCache: ProtocolSearchRequest | null = null;

export function saveProtocolSearchParams(params: ProtocolSearchRequest): void {
  memoryCache = params;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(params));
  } catch {
    // sessionStorage unavailable – memory cache is sufficient.
  }
}

export function loadProtocolSearchParams(): ProtocolSearchRequest | null {
  if (memoryCache) return memoryCache;

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProtocolSearchRequest;
      memoryCache = parsed;
      return parsed;
    }
  } catch {
    // Ignore malformed or unavailable storage.
  }

  return null;
}

export function buildSearchRequest(
  summary: string,
  inclusion: string,
  exclusion: string,
  therapeuticAreas: string[],
  topK: number = DEFAULT_TOP_K,
): ProtocolSearchRequest {
  const request: ProtocolSearchRequest = { summary, top_k: topK };
  if (inclusion.trim()) request.inclusion_criteria = inclusion.trim();
  if (exclusion.trim()) request.exclusion_criteria = exclusion.trim();
  if (therapeuticAreas.length > 0) request.therapeutic_areas = therapeuticAreas;
  return request;
}
