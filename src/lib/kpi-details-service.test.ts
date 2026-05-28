import { afterEach, describe, expect, it, vi } from "vitest";
import { kpiDetailsService } from "@/lib/kpi-details-service";
import { mockKpiData } from "@/lib/mockKpiData";

describe("kpiDetailsService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes the applied studies filters and search params to the KPI API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        active_studies: { count: 12 },
        on_track: { percentage: 60, count: 7 },
        off_track_or_at_risk: { percentage: 40, count: 5 },
        enrollment_vs_target: { percentage: 91, sum_actual: 91, sum_target: 100 },
        schedule_adherence: { percentage: 82, actual_enrollment: 9, planned_enrollment: 11 },
        velocity_vs_plan: { average: 104 },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await kpiDetailsService.getKpiDetails({
      search: "oncology",
      therapeuticAreas: ["Oncology", "Immunology"],
      phase: "II",
      status: "Active",
      portfolio: "Alpha",
      program: "Program A",
      region: "North America",
    });

    const [requestUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsedUrl = new URL(requestUrl, "https://example.test");

    expect(parsedUrl.pathname).toBe("/api/v1/study-protocol/kpi-details");
    expect(parsedUrl.searchParams.get("search")).toBe("oncology");
    expect(parsedUrl.searchParams.getAll("therapeuticArea")).toEqual(["Oncology", "Immunology"]);
    expect(parsedUrl.searchParams.get("phase")).toBe("II");
    expect(parsedUrl.searchParams.get("status")).toBe("Active");
    expect(parsedUrl.searchParams.get("portfolio")).toBe("Alpha");
    expect(parsedUrl.searchParams.get("program")).toBe("Program A");
    expect(parsedUrl.searchParams.get("region")).toBe("North America");
  });

  it("falls back to mock KPI data when the API returns an empty payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );

    const result = await kpiDetailsService.getKpiDetails({
      search: "",
      therapeuticAreas: [],
      phase: null,
      status: null,
      portfolio: null,
      program: null,
      region: null,
    });

    expect(result.source).toBe("mock");
    expect(result.error).toBeInstanceOf(Error);
    expect(result.data.activeStudiesCount).toBe(mockKpiData.active_studies.count);
  });
});