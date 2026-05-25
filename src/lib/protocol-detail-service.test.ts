import { afterEach, describe, expect, it, vi } from "vitest";
import { DETAIL_ENROLLMENT, DETAIL_INCLUSION_ITEMS, DETAIL_SITES } from "@/components/protocol-search/constants";
import { protocolDetailService } from "@/lib/protocol-detail-service";

describe("protocolDetailService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches protocol detail and maps API data to UI shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        protocol: {
          protocol_id: "NCT-12345",
          title: "Phase II NSCLC Trial",
          indication: "NSCLC",
          therapeutic_area: "Oncology",
          phase: "Phase II",
          summary: "Protocol summary from API",
          planned_start: "2025-01-10",
          actual_end: "2026-02-10",
          planned_duration: "12 mo",
          actual_duration: "13 mo",
        },
        kpis: {
          enrolled: 77,
          target: 120,
        },
        criteria: {
          inclusion: ["Adult participants", "Confirmed diagnosis"],
          exclusion: ["Recent treatment"],
        },
        sites: [
          {
            site_name: "Alpha Site",
            site_country: "United States",
            target: 20,
            actual: 8,
            planned_duration_months: 12,
            actual_duration_months: 10,
            site_type: "Academic",
            archetype: "Anchor",
          },
        ],
        ai_insights: {
          enrollment_risk: "Risk insight",
          recommendation: "Recommendation insight",
          comparable_trials: "Comparable insight",
          operational_signal: "Operational insight",
        },
        lessons_learned: "Lesson from API",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await protocolDetailService.getProtocolDetail("NCT-12345");

    expect(result.source).toBe("api");
    expect(result.error).toBeNull();

    expect(result.data.result.id).toBe("NCT-12345");
    expect(result.data.result.title).toBe("Phase II NSCLC Trial");
    expect(result.data.result.phase).toBe("PHASE II");
    expect(result.data.therapeuticArea).toBe("Oncology");
    expect(result.data.summary).toBe("Protocol summary from API");
    expect(result.data.enrollment).toEqual({ enrolled: 77, target: 120 });
    expect(result.data.inclusionItems).toEqual(["Adult participants", "Confirmed diagnosis"]);
    expect(result.data.exclusionItems).toEqual(["Recent treatment"]);
    expect(result.data.sites[0]?.name).toBe("Alpha Site");
    expect(result.data.insights.recommendation).toBe("Recommendation insight");
    expect(result.data.lessonLearned).toBe("Lesson from API");

    const [requestUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsedUrl = new URL(requestUrl, "https://example.test");
    expect(parsedUrl.pathname).toMatch(/\/(api\/)?protocol\/NCT-12345$/);
  });

  it("returns fallback data when API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      }),
    );

    const result = await protocolDetailService.getProtocolDetail("FAIL-1");

    expect(result.source).toBe("mock");
    expect(result.error).toBeInstanceOf(Error);
    expect(result.data.result.id).toBe("FAIL-1");
    expect(result.data.enrollment.target).toBe(DETAIL_ENROLLMENT.target);
    expect(result.data.sites.length).toBe(DETAIL_SITES.length);
  });

  it("returns fallback data when API payload is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => "invalid-shape",
      }),
    );

    const result = await protocolDetailService.getProtocolDetail("MALFORMED-1");

    expect(result.source).toBe("mock");
    expect(result.error).toBeInstanceOf(Error);
    expect(result.data.result.id).toBe("MALFORMED-1");
    expect(result.data.inclusionItems).toEqual([...DETAIL_INCLUSION_ITEMS]);
  });

  it("keeps API source and safely defaults missing sections on partial payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          protocol: {
            protocol_id: "PARTIAL-1",
          },
        }),
      }),
    );

    const result = await protocolDetailService.getProtocolDetail("PARTIAL-1");

    expect(result.source).toBe("api");
    expect(result.error).toBeNull();
    expect(result.data.result.id).toBe("PARTIAL-1");
    expect(result.data.sites.length).toBe(DETAIL_SITES.length);
    expect(result.data.enrollment.target).toBe(DETAIL_ENROLLMENT.target);
  });

  it("maps array-based AI insights and enrollment aliases from API payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          protocol: {
            protocol_id: "NCT06567015",
            title: "STX-241 Trial",
            therapeutic_area: "Oncology",
            indication: "NSCLC",
            phase: "PHASE_I",
            full_summary: "Summary",
            planned_start_date: "2024-09-17T00:00:00",
            actual_end_date: "2028-05-17T00:00:00",
            planned_duration_months: 45,
            actual_duration_months: 45,
            lessons_learned: "Protocol-level lesson",
          },
          kpis: {
            target_enrollment: 171,
            actual_enrollment: 54,
          },
          sites: [
            {
              site_name: "SCRI",
              country: "United States",
              target_enrollment: 23,
              actual_enrollment: 8,
            },
          ],
          ai_insights: [
            {
              type: "risk",
              title: "Enrollment Risk",
              message: "Enrollment is at 31.6% of target (54/171).",
            },
            {
              type: "warning",
              title: "Site Performance Concentration Risk",
              message: "8 sites are currently classified as Low tier.",
            },
            {
              type: "info",
              title: "Historical Learning Available",
              message:
                "This protocol already has documented lessons learned that can be used to inform future planning.",
            },
          ],
        }),
      }),
    );

    const result = await protocolDetailService.getProtocolDetail("NCT06567015");

    expect(result.source).toBe("api");
    expect(result.error).toBeNull();
    expect(result.data.enrollment).toEqual({ enrolled: 54, target: 171 });
    expect(result.data.sites[0]?.target).toBe(23);
    expect(result.data.sites[0]?.actual).toBe(8);
    expect(result.data.insights.enrollmentRisk).toBe(
      "Enrollment is at 31.6% of target (54/171).",
    );
    expect(result.data.insights.operationalSignal).toBe(
      "8 sites are currently classified as Low tier.",
    );
    expect(result.data.insights.comparableTrials).toContain("documented lessons learned");
    expect(result.data.lessonLearned).toBe("Protocol-level lesson");
  });
});
