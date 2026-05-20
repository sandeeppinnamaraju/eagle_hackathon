import { describe, expect, it } from "vitest";
import { studies } from "@/lib/data";
import { sortStudies } from "@/lib/study-sorting";

describe("sortStudies", () => {
  it("returns a sorted copy without mutating input", () => {
    const input = studies.slice(0, 10);
    const originalFirst = input[0]?.actual;

    const sorted = sortStudies(input, "actual", "asc");

    expect(sorted).not.toBe(input);
    expect(input[0]?.actual).toBe(originalFirst);
    expect(sorted.map((item) => item.actual)).toEqual(
      [...sorted.map((item) => item.actual)].sort((a, b) => a - b),
    );
  });
});
