import { daysUntil, fullName, greeting, initials, isPast, normStatus, plural, relativeDays, toDateInput, toLocalInput } from "./format";

const atDaysFromNow = (days, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

describe("relative dates", () => {
  test("relativeDays reads naturally", () => {
    expect(relativeDays(atDaysFromNow(0))).toBe("today");
    expect(relativeDays(atDaysFromNow(1))).toBe("tomorrow");
    expect(relativeDays(atDaysFromNow(-1))).toBe("yesterday");
    expect(relativeDays(atDaysFromNow(4))).toBe("in 4 days");
    expect(relativeDays(atDaysFromNow(-3))).toBe("3 days ago");
    expect(relativeDays(null)).toBe("");
    expect(relativeDays("not a date")).toBe("");
  });

  test("daysUntil counts whole calendar days", () => {
    expect(daysUntil(atDaysFromNow(2, 23))).toBe(2);
    expect(daysUntil(atDaysFromNow(-5, 1))).toBe(-5);
    expect(daysUntil(undefined)).toBeNull();
  });

  test("isPast treats a date-only value as lasting the whole day", () => {
    expect(isPast(toDateInput(new Date()))).toBe(false);
    expect(isPast(toDateInput(atDaysFromNow(-1)))).toBe(true);
    expect(isPast(new Date(Date.now() - 60_000).toISOString())).toBe(true);
    expect(isPast(new Date(Date.now() + 60_000).toISOString())).toBe(false);
    expect(isPast(null)).toBe(false);
  });
});

describe("input formatting", () => {
  test("toLocalInput and toDateInput produce the formats HTML date inputs expect", () => {
    const d = new Date(2026, 0, 5, 9, 7);
    expect(toLocalInput(d)).toBe("2026-01-05T09:07");
    expect(toDateInput(d)).toBe("2026-01-05");
    expect(toLocalInput("")).toBe("");
  });
});

describe("people and words", () => {
  test("fullName and initials handle missing parts", () => {
    expect(fullName({ firstName: "Sam", lastName: "Okafor" })).toBe("Sam Okafor");
    expect(fullName({ firstName: "Sam" })).toBe("Sam");
    expect(fullName(null)).toBe("Unknown");
    expect(fullName({}, "A neighbor")).toBe("A neighbor");
    expect(initials({ firstName: "sam", lastName: "okafor" })).toBe("SO");
    expect(initials(undefined)).toBe("?");
  });

  test("normStatus defaults to PENDING and upper-cases", () => {
    expect(normStatus(undefined)).toBe("PENDING");
    expect(normStatus("accepted")).toBe("ACCEPTED");
  });

  test("plural and greeting", () => {
    expect(plural(1, "neighbor")).toBe("1 neighbor");
    expect(plural(3, "neighbor")).toBe("3 neighbors");
    expect(plural(2, "person", "people")).toBe("2 people");
    expect(greeting(new Date(2026, 0, 1, 8))).toBe("Good morning");
    expect(greeting(new Date(2026, 0, 1, 13))).toBe("Good afternoon");
    expect(greeting(new Date(2026, 0, 1, 20))).toBe("Good evening");
  });
});
