import type { Study } from "./data";

// Country pool mirrors the one used by the study detail fallback so that the
// countries displayed inside a study match the countries used for filtering.
const COUNTRY_POOL = [
  "United States", "Canada", "United Kingdom", "Germany", "France", "Spain",
  "Italy", "Australia", "Japan", "South Korea", "Brazil", "Mexico",
  "Sweden", "New Zealand", "Netherlands", "Poland",
];

export const REGIONS = ["North America", "EU", "APAC", "LATAM", "MEA"] as const;
export type Region = (typeof REGIONS)[number];

export const COUNTRY_TO_REGION: Record<string, Region> = {
  "United States": "North America",
  "Canada": "North America",
  "Mexico": "North America",
  "United Kingdom": "EU",
  "Germany": "EU",
  "France": "EU",
  "Spain": "EU",
  "Italy": "EU",
  "Sweden": "EU",
  "Netherlands": "EU",
  "Poland": "EU",
  "Australia": "APAC",
  "Japan": "APAC",
  "South Korea": "APAC",
  "New Zealand": "APAC",
  "Brazil": "LATAM",
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic country list for a study (matches the detail page fallback). */
export function getStudyCountries(study: Study): string[] {
  const seed = hash(study.id);
  const count = Math.max(1, study.countries || 3);
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    let n = COUNTRY_POOL[(seed + i * 7) % COUNTRY_POOL.length];
    let k = 1;
    while (names.includes(n)) n = COUNTRY_POOL[(seed + i * 7 + k++) % COUNTRY_POOL.length];
    names.push(n);
  }
  return names;
}

export function getStudyRegions(study: Study): Region[] {
  const set = new Set<Region>();
  for (const c of getStudyCountries(study)) {
    const r = COUNTRY_TO_REGION[c];
    if (r) set.add(r);
  }
  return Array.from(set);
}

export interface StudyDates {
  plannedFPI: Date;
  actualFPI: Date | null;
  plannedLPO: Date;
  forecastLPO: Date | null;
}

const DAY = 86_400_000;

/** Deterministic FPI / LPO dates for a study. */
export function getStudyDates(study: Study): StudyDates {
  const seed = hash(study.id);
  // Planned FPI: spread across Jan 2024 — Dec 2025
  const plannedFPI = new Date(2024, 0, 1 + (seed % 730));
  // Actual FPI: only if study has started enrolling
  const actualFPI = study.actual > 0
    ? new Date(plannedFPI.getTime() + (((seed >> 3) % 60) - 20) * DAY)
    : null;
  // Planned LPO: 2.5 - 5 years after Planned FPI
  const plannedLPO = new Date(plannedFPI.getTime() + (900 + ((seed >> 5) % 900)) * DAY);
  // Forecast LPO: small drift around Planned LPO; only when enrolling
  const forecastLPO = study.actual > 0
    ? new Date(plannedLPO.getTime() + (((seed >> 7) % 180) - 60) * DAY)
    : null;
  return { plannedFPI, actualFPI, plannedLPO, forecastLPO };
}

const TODAY = new Date(2026, 4, 20); // 20 May 2026 — keep in sync with app "now"

export function dateInRange(d: Date, range: string): boolean {
  if (range === "All time") return true;
  const start = new Date(TODAY);
  if (range === "Last 30 days") start.setDate(start.getDate() - 30);
  else if (range === "Last 90 days") start.setDate(start.getDate() - 90);
  else if (range === "Last 12 months") start.setFullYear(start.getFullYear() - 1);
  else if (range === "YTD") { start.setMonth(0); start.setDate(1); }
  else return true;
  return d >= start && d <= TODAY;
}

export function studyMatchesDateRange(study: Study, range: string): boolean {
  if (!range || range === "All time") return true;
  const d = getStudyDates(study);
  const candidates = [d.plannedFPI, d.actualFPI, d.plannedLPO, d.forecastLPO].filter(Boolean) as Date[];
  return candidates.some((c) => dateInRange(c, range));
}

export function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
