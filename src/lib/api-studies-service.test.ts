import { afterEach, describe, expect, it, vi } from "vitest";
import { apiStudiesService } from "@/lib/api-studies-service";
import type { StudiesQuery } from "@/lib/studies-service-types";

describe("apiStudiesService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("infers hasMore from total when hasMore is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: Array.from({ length: 200 }, (_, index) => ({ id: `S-${index}` })),
        page: 1,
        limit: 200,
        total: 450,
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const query: StudiesQuery = {
      page: 1,
      limit: 200,
    };

    const result = await apiStudiesService.getStudies(query);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(200);
    expect(result.total).toBe(450);
    expect(result.hasMore).toBe(true);
    expect(result.items).toHaveLength(200);
  });

  it("falls back to page-size inference when hasMore and total are missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: Array.from({ length: 50 }, (_, index) => ({ id: `S2-${index}` })),
        page: 2,
        limit: 200,
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const query: StudiesQuery = {
      page: 2,
      limit: 200,
    };

    const result = await apiStudiesService.getStudies(query);

    expect(result.page).toBe(2);
    expect(result.limit).toBe(200);
    expect(result.hasMore).toBe(false);
    expect(result.items).toHaveLength(50);
  });
});
