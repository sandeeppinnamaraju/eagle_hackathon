import type { Study } from "@/lib/data";
import { withApiBaseUrl, withApiRequestConfig } from "@/lib/api-config";

const STUDIES_API_PATH = "/api/studies";
const STUDIES_API_FALLBACK_URL = "/api/studies";

export async function fetchStudiesFromApi(signal?: AbortSignal): Promise<Study[] | null> {
  const response = await fetch(
    withApiBaseUrl(STUDIES_API_PATH, STUDIES_API_FALLBACK_URL),
    withApiRequestConfig({
      method: "GET",
      signal,
    }),
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch studies: ${response.status}`);
  }

  const payload = (await response.json()) as Study[] | null;
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return payload;
}
