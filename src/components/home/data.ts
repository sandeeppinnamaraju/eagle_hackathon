export interface HomeStat {
  label: string;
  value: string;
}

export type ProgressTone = "success" | "primary" | "warning";

export interface HomeProgressItem {
  label: string;
  value: number;
  tone: ProgressTone;
}

export const HOME_STATS: HomeStat[] = [
  { label: "Active studies", value: "120+" },
  { label: "Countries", value: "45" },
  { label: "Sites monitored", value: "2.4k" },
];

export const HOME_PORTFOLIO_PROGRESS: HomeProgressItem[] = [
  { label: "Enrollment vs plan", value: 92, tone: "success" },
  { label: "Sites activated", value: 78, tone: "primary" },
  { label: "Protocol deviations", value: 14, tone: "warning" },
];