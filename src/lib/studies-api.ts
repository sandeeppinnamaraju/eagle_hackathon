import type { Study } from "@/lib/data";

const STUDIES_API_PATH = "/api/studies";

export async function fetchStudiesFromApi(signal?: AbortSignal): Promise<Study[] | null> {
  const response = await fetch(STUDIES_API_PATH, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch studies: ${response.status}`);
  }

  const payload = (await response.json()) as Study[] | null;
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return payload;
}
