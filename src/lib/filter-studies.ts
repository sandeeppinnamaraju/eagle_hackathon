import type { Study } from "./data";
import type { FilterState } from "@/components/portfolio-filters";
import { getStudyDates, getStudyRegions } from "./study-derived";

type Key = keyof FilterState;

function parse(d: string | null): Date | null {
  if (!d) return null;
  const t = new Date(d);
  return isNaN(t.getTime()) ? null : t;
}

function inRange(d: Date | null, from: Date | null, to: Date | null): boolean {
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export function filterStudies(
  studies: Study[],
  f: FilterState,
  except?: Key,
): Study[] {
  const q = f.search.trim().toLowerCase();
  const use = (k: Key) => k !== except;
  const fpiFrom = parse(f.fpiFrom);
  const fpiTo = parse(f.fpiTo);
  const lpoFrom = parse(f.lpoFrom);
  const lpoTo = parse(f.lpoTo);
  const hasFpi = use("fpiFrom") && use("fpiTo") && (fpiFrom || fpiTo);
  const hasLpo = use("lpoFrom") && use("lpoTo") && (lpoFrom || lpoTo);

  return studies.filter((s) => {
    if (use("search") && q && !(
      s.id.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.indication.toLowerCase().includes(q)
    )) return false;
    if (use("areas") && f.areas.length > 0 && !f.areas.includes(s.therapeuticArea)) return false;
    if (use("phase") && f.phase && s.phase !== f.phase) return false;
    if (use("status") && f.status && s.status !== f.status) return false;
    if (use("portfolio") && f.portfolio && s.portfolio !== f.portfolio) return false;
    if (use("program") && f.program && s.program !== f.program) return false;
    if (use("region") && f.region && !getStudyRegions(s).includes(f.region as never)) return false;
    if (hasFpi || hasLpo) {
      const d = getStudyDates(s);
      if (hasFpi) {
        const fpi = d.actualFPI ?? d.plannedFPI;
        if (!inRange(fpi, fpiFrom, fpiTo)) return false;
      }
      if (hasLpo) {
        const lpo = d.forecastLPO ?? d.plannedLPO;
        if (!inRange(lpo, lpoFrom, lpoTo)) return false;
      }
    }
    return true;
  });
}
