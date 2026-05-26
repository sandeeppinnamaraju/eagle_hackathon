import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useInfiniteStudies } from "@/hooks/use-infinite-studies";
import type { Study } from "@/lib/data";
import type { UseInfiniteStudiesResult } from "@/hooks/use-infinite-studies";

vi.mock("@/lib/studies-service", () => ({
  studiesService: {
    getStudies: vi.fn(),
  },
}));

import { studiesService } from "@/lib/studies-service";

const mockedGetStudies = vi.mocked(studiesService.getStudies);

let observerCallback: IntersectionObserverCallback | null = null;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "300px";
  readonly scrollMargin = "0px";
  readonly thresholds = [0];

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }

  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

const originalIntersectionObserver = globalThis.IntersectionObserver;

function makeStudy(page: number, index: number): Study {
  return {
    id: `P${page}-${index}`,
    phase: "Ph II",
    therapeuticArea: "Immunology",
    indication: `Indication ${page}-${index}`,
    title: `Study ${page}-${index}`,
    portfolio: "Immunology Portfolio",
    program: `GEN-${page}${index}`,
    status: "Recruiting",
    priority: "Medium",
    target: 100,
    actual: 50,
    percentVsPlan: 100,
    countries: 5,
    sites: 10,
    performance: "On Track",
    trend: [1, 2, 3],
  };
}

function makeStudies(page: number, count: number): Study[] {
  return Array.from({ length: count }, (_, index) => makeStudy(page, index));
}

describe("useInfiniteStudies", () => {
  beforeEach(() => {
    observerCallback = null;
    globalThis.IntersectionObserver = MockIntersectionObserver;
    mockedGetStudies.mockReset();
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  it("appends the next page without resetting the accumulated studies", async () => {
    const firstPage = makeStudies(1, 200);
    const secondPage = makeStudies(2, 200);

    mockedGetStudies
      .mockResolvedValueOnce({ items: firstPage, page: 1, limit: 200, total: 960, hasMore: true })
      .mockResolvedValueOnce({ items: secondPage, page: 2, limit: 200, total: 960, hasMore: true });

    let latestHook: UseInfiniteStudiesResult | null = null;

    function Harness() {
      latestHook = useInfiniteStudies({ appendDelayMs: 0 });
      return <div ref={latestHook.loadMoreRef} />;
    }

    render(<Harness />);

    await waitFor(() => {
      expect(latestHook?.studies).toHaveLength(200);
    });

    expect(mockedGetStudies).toHaveBeenCalledTimes(1);
    expect(mockedGetStudies).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ page: 1, limit: 200 }),
      expect.any(AbortSignal),
    );

    await waitFor(() => {
      expect(observerCallback).not.toBeNull();
    });

    act(() => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    await waitFor(() => {
      expect(latestHook?.studies).toHaveLength(400);
    });

    const finalStudies = (latestHook as UseInfiniteStudiesResult | null)?.studies;

    if (!finalStudies) {
      throw new Error("Hook did not initialize");
    }

    expect(mockedGetStudies).toHaveBeenCalledTimes(2);
    expect(mockedGetStudies).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ page: 2, limit: 200 }),
      expect.any(AbortSignal),
    );
    expect(finalStudies.at(-1)?.id).toBe("P2-199");
  });

  it("prevents duplicate append calls while the next page request is in flight", async () => {
    const firstPage = makeStudies(1, 200);
    const secondPage = makeStudies(2, 200);

    let resolveSecondPage: ((value: {
      items: Study[];
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    }) => void) | null = null;

    mockedGetStudies
      .mockResolvedValueOnce({ items: firstPage, page: 1, limit: 200, total: 960, hasMore: true })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecondPage = resolve;
          }),
      );

    let latestHook: UseInfiniteStudiesResult | null = null;

    function Harness() {
      latestHook = useInfiniteStudies({ appendDelayMs: 0 });
      return <div ref={latestHook.loadMoreRef} />;
    }

    render(<Harness />);

    await waitFor(() => {
      expect(latestHook?.studies).toHaveLength(200);
    });

    await waitFor(() => {
      expect(observerCallback).not.toBeNull();
    });

    act(() => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(mockedGetStudies).toHaveBeenCalledTimes(2);
    expect(mockedGetStudies).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ page: 2, limit: 200 }),
      expect.any(AbortSignal),
    );

    if (!resolveSecondPage) {
      throw new Error("Expected second page resolver to be set");
    }

    await act(async () => {
      resolveSecondPage?.({ items: secondPage, page: 2, limit: 200, total: 960, hasMore: true });
    });

    await waitFor(() => {
      expect(latestHook?.studies).toHaveLength(400);
    });
  });
});