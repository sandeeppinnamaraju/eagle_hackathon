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

  it("sorts numeric fields in descending order", () => {
    const input = studies.slice(0, 10);

    const sorted = sortStudies(input, "actual", "desc");

    expect(sorted.map((item) => item.actual)).toEqual(
      [...sorted.map((item) => item.actual)].sort((a, b) => b - a),
    );
  });

  it("sorts text fields in both ascending and descending order", () => {
    const input = studies.slice(0, 10);

    const asc = sortStudies(input, "id", "asc");
    const desc = sortStudies(input, "id", "desc");

    expect(asc.map((item) => item.id)).toEqual(
      [...asc.map((item) => item.id)].sort((a, b) => a.localeCompare(b)),
    );
    expect(desc.map((item) => item.id)).toEqual(
      [...desc.map((item) => item.id)].sort((a, b) => b.localeCompare(a)),
    );
  });
});
