import type { ProtocolResult } from "@/lib/data";

const PROTOCOL_RESULTS_API_PATH = "/api/protocol-results";

export async function fetchProtocolResultsFromApi(signal?: AbortSignal): Promise<ProtocolResult[] | null> {
  const response = await fetch(PROTOCOL_RESULTS_API_PATH, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch protocol results: ${response.status}`);
  }

  const payload = (await response.json()) as ProtocolResult[] | null;
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return payload;
}
