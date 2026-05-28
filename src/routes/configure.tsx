import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  performanceThresholdService,
  type PerformanceThresholdRequest,
} from "@/lib/performance-threshold-service";
import {
  AtRiskThresholdSection,
  ConfigureInfoBanner,
  ConfigurePageHeader,
  ConfigurePageLayout,
  OffTrackThresholdSection,
  OnTrackThresholdSection,
  SaveConfigurationButton,
  ThresholdBandPreview,
} from "@/components/configure/configure-page-sections";

export const Route = createFileRoute("/configure")({
  head: () => ({
    meta: [
      { title: "Configure — Flight Deck" },
      { name: "description", content: "Configure performance status thresholds for studies, countries, and sites." },
    ],
  }),
  component: ConfigurePage,
});

const STORAGE_KEY = "flightdeck.thresholds";

interface Thresholds {
  onTrack: number;
  atRiskFrom: number;
}

const DEFAULTS: Thresholds = { onTrack: 95, atRiskFrom: 80 };

interface ThresholdValidation {
  valid: boolean;
  error: string | null;
}

const isValidThresholdValue = (value: number): boolean =>
  Number.isFinite(value) && value >= 1 && value <= 100;

function validateThresholdPayload(payload: PerformanceThresholdRequest): ThresholdValidation {
  if (!isValidThresholdValue(payload.onTrack)) {
    return { valid: false, error: "On Track must be between 1 and 100." };
  }

  if (!isValidThresholdValue(payload.atRiskStart)) {
    return { valid: false, error: "At Risk start must be between 1 and 100." };
  }

  if (!isValidThresholdValue(payload.atRiskEnd)) {
    return { valid: false, error: "At Risk end must be between 1 and 100." };
  }

  if (!isValidThresholdValue(payload.offTrack)) {
    return { valid: false, error: "Off Track must be between 1 and 100." };
  }

  if (payload.atRiskStart > payload.atRiskEnd) {
    return { valid: false, error: "At Risk start must be less than or equal to At Risk end." };
  }

  if (payload.atRiskEnd >= payload.onTrack) {
    return { valid: false, error: "At Risk end must be less than On Track." };
  }

  return { valid: true, error: null };
}

function loadThresholds(): Thresholds {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Thresholds>;
    return {
      onTrack: typeof parsed.onTrack === "number" ? parsed.onTrack : DEFAULTS.onTrack,
      atRiskFrom: typeof parsed.atRiskFrom === "number" ? parsed.atRiskFrom : DEFAULTS.atRiskFrom,
    };
  } catch {
    return DEFAULTS;
  }
}

function ConfigurePage() {
  const [onTrack, setOnTrack] = useState<number>(DEFAULTS.onTrack);
  const [atRiskFrom, setAtRiskFrom] = useState<number>(DEFAULTS.atRiskFrom);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = loadThresholds();
    setOnTrack(t.onTrack);
    setAtRiskFrom(t.atRiskFrom);
  }, []);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const safeOnTrack = clamp(Number.isFinite(onTrack) ? onTrack : 95, 1, 100);
  const safeAtRiskFrom = clamp(
    Number.isFinite(atRiskFrom) ? atRiskFrom : 80,
    1,
    Math.max(1, safeOnTrack - 1),
  );
  const offTrackMax = safeAtRiskFrom;
  const atRiskEnd = Math.max(1, safeOnTrack - 1);

  async function handleSave() {
    setSaving(true);
    const payload: Thresholds = { onTrack: safeOnTrack, atRiskFrom: safeAtRiskFrom };
    const apiPayload: PerformanceThresholdRequest = {
      onTrack: safeOnTrack,
      atRiskStart: safeAtRiskFrom,
      atRiskEnd,
      offTrack: offTrackMax,
    };

    const validation = validateThresholdPayload(apiPayload);
    if (!validation.valid) {
      toast.error(validation.error ?? "Invalid threshold values.");
      setSaving(false);
      return;
    }

    try {
      const result = await performanceThresholdService.saveThresholds(apiPayload);
      if (!result.success) {
        toast.error(result.message || "Could not save configuration");
        return;
      }

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        toast.error("Configuration was saved, but local caching failed");
      }

      toast.success(result.message || "Configuration saved");
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Could not save configuration";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConfigurePageLayout>
      <ConfigurePageHeader
        title="Performance Status Thresholds"
        description={
          <>
            Define how <span className="font-semibold text-foreground">% Enrollment vs Plan</span> maps to a
            study's performance status across the portfolio dashboard and study overview pages.
          </>
        }
      />

      <ConfigureInfoBanner />

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <OnTrackThresholdSection onTrack={onTrack} safeOnTrack={safeOnTrack} onTrackChanged={setOnTrack} />
        <AtRiskThresholdSection
          atRiskFrom={atRiskFrom}
          safeAtRiskFrom={safeAtRiskFrom}
          safeOnTrack={safeOnTrack}
          atRiskFromChanged={setAtRiskFrom}
        />
        <OffTrackThresholdSection offTrackMax={offTrackMax} />
      </div>

      <ThresholdBandPreview
        safeOnTrack={safeOnTrack}
        safeAtRiskFrom={safeAtRiskFrom}
        offTrackMax={offTrackMax}
      />

      <SaveConfigurationButton saving={saving} onSave={handleSave} />
    </ConfigurePageLayout>
  );
}
