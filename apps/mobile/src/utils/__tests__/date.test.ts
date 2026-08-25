import { getWeekDays, toDateKey } from "../date";

describe("date utilities", () => {
  it("uses a Monday-first week across month boundaries", () => {
    const days = getWeekDays(0, new Date(2026, 7, 25, 12));
    expect(toDateKey(days[0]!.fullDate)).toBe("2026-08-24");
    expect(toDateKey(days[6]!.fullDate)).toBe("2026-08-30");
  });

  it("formats dates without UTC rollover", () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});
