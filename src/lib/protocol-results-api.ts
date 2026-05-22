import type { ProtocolResult } from "@/lib/data";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";

const PROTOCOL_RESULTS_API_PATH = "/protocol-results";
const PROTOCOL_RESULTS_API_FALLBACK_URL = "/api/protocol-results";

export async function fetchProtocolResultsFromApi(signal?: AbortSignal): Promise<ProtocolResult[] | null> {
  const response = await fetch(
    withApiBaseUrl(PROTOCOL_RESULTS_API_PATH, PROTOCOL_RESULTS_API_FALLBACK_URL),
    withApiRequestConfig({
      method: "GET",
      signal,
    }),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch protocol results: ${response.status}`);
  }

  const payload = (await response.json()) as ProtocolResult[] | null;
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return payload;
}
