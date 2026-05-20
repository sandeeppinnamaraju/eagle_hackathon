import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { protocolResults as fallbackResults } from "@/lib/data";
import { useProtocolResultsData } from "@/hooks/use-protocol-results-data";

vi.mock("@/lib/protocol-results-api", () => ({
  fetchProtocolResultsFromApi: vi.fn(),
}));

import { fetchProtocolResultsFromApi } from "@/lib/protocol-results-api";

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

describe("useProtocolResultsData", () => {
  it("uses fallback results and exposes error when API fails", async () => {
    vi.mocked(fetchProtocolResultsFromApi).mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(
      () => useProtocolResultsData({ fallbackResults }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.results).toEqual(fallbackResults);
  });
});
