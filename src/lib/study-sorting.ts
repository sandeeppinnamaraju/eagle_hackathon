import type { Study } from "@/lib/data";

export type StudySortKey =
  | "id"
  | "phase"
  | "therapeuticArea"
  | "indication"
  | "portfolioProgram"
  | "status"
  | "priority"
  | "target"
  | "actual"
  | "percentVsPlan"
  | "countries"
  | "sites"
  | "performance";

export type StudySortDirection = "asc" | "desc";

const priorityRank: Record<Study["priority"], number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

const performanceRank: Record<Study["performance"], number> = {
  "—": 0,
  "Off Track": 1,
  "At Risk": 2,
  "On Track": 3,
};

const compareString = (left: string, right: string) => left.localeCompare(right);

const compareNumber = (left: number, right: number) => left - right;

const compareNullableNumber = (left: number | null, right: number | null) => {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left - right;
};

const compareStudies = (left: Study, right: Study, sortBy: StudySortKey) => {
  switch (sortBy) {
    case "id":
      return compareString(left.id, right.id);
    case "phase":
      return compareString(left.phase, right.phase);
    case "therapeuticArea":
      return compareString(left.therapeuticArea, right.therapeuticArea);
    case "indication":
      return compareString(left.indication, right.indication);
    case "portfolioProgram": {
      const portfolioCompare = compareString(left.portfolio, right.portfolio);
      if (portfolioCompare !== 0) return portfolioCompare;
      return compareString(left.program, right.program);
    }
    case "status":
      return compareString(left.status, right.status);
    case "priority":
      return compareNumber(priorityRank[left.priority], priorityRank[right.priority]);
    case "target":
      return compareNumber(left.target, right.target);
    case "actual":
      return compareNumber(left.actual, right.actual);
    case "percentVsPlan":
      return compareNullableNumber(left.percentVsPlan, right.percentVsPlan);
    case "countries":
      return compareNumber(left.countries, right.countries);
    case "sites":
      return compareNumber(left.sites, right.sites);
    case "performance":
      return compareNumber(performanceRank[left.performance], performanceRank[right.performance]);
    default:
      return 0;
  }
};

export function sortStudies(
  studies: Study[],
  sortBy: StudySortKey | null,
  sortDirection: StudySortDirection,
) {
  const sortedStudies = [...studies];

  if (!sortBy) {
    return sortedStudies;
  }

  const direction = sortDirection === "asc" ? 1 : -1;
  return sortedStudies.sort((left, right) => compareStudies(left, right, sortBy) * direction);
}
