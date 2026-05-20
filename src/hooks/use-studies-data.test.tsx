import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { studies as fallbackStudies } from "@/lib/data";
import { useStudiesData } from "@/hooks/use-studies-data";

vi.mock("@/lib/studies-api", () => ({
  fetchStudiesFromApi: vi.fn(),
}));

import { fetchStudiesFromApi } from "@/lib/studies-api";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useStudiesData", () => {
  it("uses fallback data and exposes error when API fails", async () => {
    vi.mocked(fetchStudiesFromApi).mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(
      () => useStudiesData({ fallbackStudies }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.studies).toEqual(fallbackStudies);
  });
});
