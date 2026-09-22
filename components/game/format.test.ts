import { describe, expect, it } from "vitest";

import { formatMoney, formatPercentChange } from "@/components/game/format";

describe("formatMoney", () => {
  it("formats whole dollars without cents", () => {
    expect(formatMoney(1840)).toBe("$1,840");
  });

  it("formats amounts with cents using two decimals", () => {
    expect(formatMoney(1250.5)).toBe("$1,250.50");
  });

  it("adds a thousands separator", () => {
    expect(formatMoney(1250000)).toBe("$1,250,000");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("$0");
  });

  it("formats sub-dollar cents", () => {
    expect(formatMoney(5.99)).toBe("$5.99");
  });
});

describe("formatPercentChange", () => {
  it("formats a positive change with a plus sign and one decimal", () => {
    expect(formatPercentChange(11240, 10000)).toBe("+12.4%");
  });

  it("formats a negative change with a minus sign and one decimal", () => {
    expect(formatPercentChange(9700, 10000)).toBe("-3.0%");
  });

  it("formats exactly zero change as +0.0%", () => {
    expect(formatPercentChange(10000, 10000)).toBe("+0.0%");
  });

  it("returns +0.0% when the amount spent is zero", () => {
    expect(formatPercentChange(5000, 0)).toBe("+0.0%");
  });
});
