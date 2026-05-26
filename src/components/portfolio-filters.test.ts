import { describe, expect, it } from "vitest";
import { monthBoundary, monthInputValue, monthYearLabel } from "@/components/portfolio-filters";

describe("portfolio date month helpers", () => {
  it("maps a selected month to the first day for from filters", () => {
    expect(monthBoundary("2026-05", "start")).toBe("2026-05-01");
  });

  it("maps a selected month to the correct last day for to filters", () => {
    expect(monthBoundary("2024-02", "end")).toBe("2024-02-29");
    expect(monthBoundary("2025-02", "end")).toBe("2025-02-28");
    expect(monthBoundary("2026-04", "end")).toBe("2026-04-30");
  });

  it("derives the month input value from stored iso dates", () => {
    expect(monthInputValue("2026-05-31")).toBe("2026-05");
    expect(monthInputValue(null)).toBe("");
  });

  it("formats the selected month and year for display", () => {
    expect(monthYearLabel("2026-05-01")).toBe("May 2026");
    expect(monthYearLabel("2024-02-29")).toBe("February 2024");
    expect(monthYearLabel(null)).toBeNull();
  });
});