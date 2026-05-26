import type { Study } from "@/lib/data";
import type { StudySortKey, StudySortDirection } from "@/lib/study-sorting";

// ─── Standardized response shape ────────────────────────────────────────────
export interface StudiesPage {
  items: Study[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// ─── Query params passed from UI to the service layer ───────────────────────
export interface StudiesQuery {
  page: number;
  limit: number;
  search?: string;
  therapeuticAreas?: string[];
  phase?: string | null;
  status?: string | null;
  portfolio?: string | null;
  program?: string | null;
  region?: string | null;
  fpiStartDate?: string | null;
  fpiEndDate?: string | null;
  lpoStartDate?: string | null;
  lpoEndDate?: string | null;
  sortBy?: StudySortKey | null;
  sortOrder?: StudySortDirection;
}

// ─── Contract every service implementation must satisfy ─────────────────────
export interface IStudiesService {
  getStudies(query: StudiesQuery, signal?: AbortSignal): Promise<StudiesPage>;
}
