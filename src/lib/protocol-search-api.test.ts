import { afterEach, describe, expect, it, vi } from "vitest";
import { searchProtocols } from "@/lib/protocol-search-api";

describe("searchProtocols", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps inclusion_preview into bullets when summary_bullets is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              protocol_id: "NCT-111",
              title: "Protocol A",
              indication: "NSCLC",
              therapeutic_area: "Oncology",
              inclusion_preview: [
                "Adult participants",
                "Confirmed diagnosis",
              ],
              match: 82,
            },
          ],
        }),
      }),
    );

    const result = await searchProtocols({ summary: "find protocols" });

    expect(result).not.toBeNull();
    expect(result?.[0]?.id).toBe("NCT-111");
    expect(result?.[0]?.bullets).toEqual([
      "Adult participants",
      "Confirmed diagnosis",
    ]);
  });

  it("keeps summary_bullets precedence when both summary and inclusion previews exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              protocol_id: "NCT-222",
              title: "Protocol B",
              summary_bullets: ["Preferred summary bullet"],
              inclusion_preview: ["Fallback inclusion bullet"],
              similarity_score: 0.91,
            },
          ],
        }),
      }),
    );

    const result = await searchProtocols({ summary: "find protocols" });

    expect(result?.[0]?.bullets).toEqual(["Preferred summary bullet"]);
    expect(result?.[0]?.match).toBe(91);
  });

  it("strips leading numbering from inclusion_preview items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              protocol_id: "NCT-333",
              title: "Protocol C",
              inclusion_preview: [
                "1. be \u2265 18 years of age on the day of signing of informed consent.",
                "2. confirmed Stage 4 NSCLC (squamous or non-squamous) and be considered for standard of care",
              ],
              match: 80,
            },
          ],
        }),
      }),
    );

    const result = await searchProtocols({ summary: "find protocols" });

    expect(result?.[0]?.bullets).toEqual([
      "be \u2265 18 years of age on the day of signing of informed consent.",
      "confirmed Stage 4 NSCLC (squamous or non-squamous) and be considered for standard of care",
    ]);
  });
});
