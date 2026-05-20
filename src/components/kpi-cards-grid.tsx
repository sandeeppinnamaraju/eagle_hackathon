import { KpiCard, type KpiCardAccent } from "@/components/kpi-card";
import type { KpiDetailsData } from "@/lib/kpi-details-types";

interface KpiCardsGridProps {
  data: KpiDetailsData | null;
  isLoading?: boolean;
}

interface KpiCardItem {
  label: string;
  value: string;
  sub: string;
  accent: KpiCardAccent;
  spark?: number[];
}

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

const formatCount = (value: number): string => value.toLocaleString();

const getLoadingCards = (): KpiCardItem[] => [
  {
    label: "Active Studies",
    value: "...",
    sub: "Loading...",
    accent: "primary",
  },
  {
    label: "On Track",
    value: "...",
    sub: "Loading...",
    accent: "success",
  },
  {
    label: "At Risk / Off Track",
    value: "...",
    sub: "Loading...",
    accent: "warning",
  },
  {
    label: "Enrollment vs Target",
    value: "...",
    sub: "Loading...",
    accent: "info",
    spark: [2, 4, 5, 8, 11, 14],
  },
  {
    label: "Schedule Adherence",
    value: "...",
    sub: "Loading...",
    accent: "violet",
  },
  {
    label: "Velocity vs Plan",
    value: "...",
    sub: "Loading...",
    accent: "teal",
  },
];

const getKpiCards = (data: KpiDetailsData): KpiCardItem[] => [
  {
    label: "Active Studies",
    value: formatCount(data.activeStudiesCount),
    sub: "recruiting or follow-up",
    accent: "primary",
  },
  {
    label: "On Track",
    value: formatPercent(data.onTrack.percentage),
    sub: `${formatCount(data.onTrack.count)} of ${formatCount(data.activeStudiesCount)} active`,
    accent: "success",
  },
  {
    label: "At Risk / Off Track",
    value: formatPercent(data.offTrackOrAtRisk.percentage),
    sub: `${formatCount(data.offTrackOrAtRisk.count)} of ${formatCount(data.activeStudiesCount)} active`,
    accent: "warning",
  },
  {
    label: "Enrollment vs Target",
    value: formatPercent(data.enrollmentVsTarget.percentage),
    sub: `${formatCount(data.enrollmentVsTarget.sumActual)} of ${formatCount(data.enrollmentVsTarget.sumTarget)} patients`,
    accent: "info",
    spark: [2, 4, 5, 8, 11, 14],
  },
  {
    label: "Schedule Adherence",
    value: formatPercent(data.scheduleAdherence.percentage),
    sub: `${formatCount(data.scheduleAdherence.completed)} of ${formatCount(data.scheduleAdherence.planned)} planned`,
    accent: "violet",
  },
  {
    label: "Velocity vs Plan",
    value: formatPercent(data.velocityVsPlan.average),
    sub: "avg enrollment speed",
    accent: "teal",
  },
];

export function KpiCardsGrid({ data, isLoading = false }: KpiCardsGridProps) {
  const cards = !data || isLoading ? getLoadingCards() : getKpiCards(data);

  return (
    <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <KpiCard
          key={card.label}
          label={card.label}
          value={card.value}
          sub={card.sub}
          accent={card.accent}
          spark={card.spark}
        />
      ))}
    </div>
  );
}
