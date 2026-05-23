import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useKpiDetails } from "@/hooks/use-kpi-details";
import { mockKpiData } from "@/lib/mockKpiData";

vi.mock("@/lib/kpi-details-service", () => ({
  kpiDetailsService: {
    getKpiDetails: vi.fn(),
  },
}));

import { kpiDetailsService } from "@/lib/kpi-details-service";

describe("useKpiDetails", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("refetches KPI data when the applied studies query changes", async () => {
    vi.mocked(kpiDetailsService.getKpiDetails)
      .mockResolvedValueOnce({
        data: {
          activeStudiesCount: 1,
          onTrack: { percentage: 10, count: 1 },
          offTrackOrAtRisk: { percentage: 20, count: 2 },
          enrollmentVsTarget: { percentage: 30, sumActual: 3, sumTarget: 10 },
          scheduleAdherence: { percentage: 40, completed: 4, planned: 10 },
          velocityVsPlan: { average: 50 },
        },
        source: "api",
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          activeStudiesCount: 2,
          onTrack: { percentage: 11, count: 2 },
          offTrackOrAtRisk: { percentage: 21, count: 3 },
          enrollmentVsTarget: { percentage: 31, sumActual: 4, sumTarget: 11 },
          scheduleAdherence: { percentage: 41, completed: 5, planned: 11 },
          velocityVsPlan: { average: 51 },
        },
        source: "api",
        error: null,
      });

    const { result, rerender } = renderHook(
      ({ query }) => useKpiDetails(query),
      {
        initialProps: {
          query: {
            search: "oncology",
            therapeuticAreas: ["Oncology"],
            phase: null,
            status: null,
            portfolio: null,
            program: null,
            region: null,
          },
        },
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({
      query: {
        search: "immunology",
        therapeuticAreas: ["Immunology"],
        phase: null,
        status: "Active",
        portfolio: null,
        program: null,
        region: null,
      },
    });

    await waitFor(() => {
      expect(vi.mocked(kpiDetailsService.getKpiDetails)).toHaveBeenCalledTimes(2);
    });

    expect(vi.mocked(kpiDetailsService.getKpiDetails)).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        search: "oncology",
        therapeuticAreas: ["Oncology"],
      }),
      expect.any(AbortSignal),
    );
    expect(vi.mocked(kpiDetailsService.getKpiDetails)).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        search: "immunology",
        therapeuticAreas: ["Immunology"],
        status: "Active",
      }),
      expect.any(AbortSignal),
    );
  });

  it("exposes fallback state when the KPI service falls back to mock data", async () => {
    vi.mocked(kpiDetailsService.getKpiDetails).mockResolvedValue({
      data: {
        activeStudiesCount: mockKpiData.active_studies.count,
        onTrack: {
          percentage: mockKpiData.on_track.percentage,
          count: mockKpiData.on_track.count,
        },
        offTrackOrAtRisk: {
          percentage: mockKpiData.off_track_or_at_risk.percentage,
          count: mockKpiData.off_track_or_at_risk.count,
        },
        enrollmentVsTarget: {
          percentage: mockKpiData.enrollment_vs_target.percentage,
          sumActual: mockKpiData.enrollment_vs_target.sum_actual,
          sumTarget: mockKpiData.enrollment_vs_target.sum_target,
        },
        scheduleAdherence: {
          percentage: 80,
          completed: 8,
          planned: 10,
        },
        velocityVsPlan: {
          average: mockKpiData.velocity_vs_plan.average,
        },
      },
      source: "mock",
      error: new Error("network"),
    });

    const { result } = renderHook(() =>
      useKpiDetails({
        search: "",
        therapeuticAreas: [],
        phase: null,
        status: null,
        portfolio: null,
        program: null,
        region: null,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isUsingFallback).toBe(true);
    expect(result.current.error?.message).toBe("network");
  });
});