import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";

export type KpiCardAccent = "primary" | "success" | "warning" | "danger" | "info" | "violet" | "teal";

interface Props {
  label: string;
  value: string;
  sub?: string;
  accent: KpiCardAccent;
  spark?: number[];
}

const borderMap = {
  primary: "border-l-[oklch(0.52_0.19_263)]",
  success: "border-l-[oklch(0.55_0.14_150)]",
  warning: "border-l-[oklch(0.72_0.15_75)]",
  danger: "border-l-[oklch(0.6_0.2_25)]",
  info: "border-l-[oklch(0.55_0.16_250)]",
  violet: "border-l-[oklch(0.55_0.18_300)]",
  teal: "border-l-[oklch(0.6_0.13_200)]",
};

const tintMap = {
  primary: "bg-[oklch(0.97_0.02_263)]",
  success: "bg-[oklch(0.97_0.04_150)]",
  warning: "bg-[oklch(0.98_0.04_85)]",
  danger: "bg-[oklch(0.98_0.03_25)]",
  info: "bg-[oklch(0.97_0.03_250)]",
  violet: "bg-[oklch(0.97_0.03_300)]",
  teal: "bg-[oklch(0.97_0.03_200)]",
};

const sparkColor = {
  primary: "oklch(0.52 0.19 263)",
  success: "oklch(0.55 0.14 150)",
  warning: "oklch(0.65 0.15 75)",
  danger: "oklch(0.6 0.2 25)",
  info: "oklch(0.55 0.16 250)",
  violet: "oklch(0.55 0.18 300)",
  teal: "oklch(0.6 0.13 200)",
};

export function KpiCard({ label, value, sub, accent, spark }: Props) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border border-l-4 bg-card p-4 shadow-card",
        borderMap[accent],
        tintMap[accent],
      )}
    >
      <p className="min-h-[2.25rem] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      {spark && (
        <Sparkline
          data={spark}
          stroke={sparkColor[accent]}
          className="mt-2 h-6 w-full"
          width={160}
          height={24}
        />
      )}
    </div>
  );
}
