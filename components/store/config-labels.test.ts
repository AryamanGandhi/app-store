import { describe, expect, it } from "vitest";

import { PRESET_MODES } from "@/lib/data/modes";
import type { GameConfig } from "@/lib/types";

import {
  boardLabel,
  configRows,
  holdLabel,
  moneyLabel,
  picksLabel,
  roundsLabel,
  sellingLabel,
  stocksShownLabel,
} from "@/components/store/config-labels";

const baseConfig: GameConfig = PRESET_MODES[0].config;

describe("config label helpers", () => {
  it("returns the right rounds label for allowed values", () => {
    expect(roundsLabel({ ...baseConfig, rounds: 5 })).toBe("5 rounds");
    expect(roundsLabel({ ...baseConfig, rounds: 6 })).toBe("6 rounds");
    expect(roundsLabel({ ...baseConfig, rounds: 8 })).toBe("8 rounds");
    expect(roundsLabel({ ...baseConfig, rounds: 10 })).toBe("10 rounds");
  });

  it("returns the right stocks shown label for allowed values", () => {
    expect(stocksShownLabel({ ...baseConfig, stocksPerRound: 1 })).toBe("1 stock");
    expect(stocksShownLabel({ ...baseConfig, stocksPerRound: 5 })).toBe("5 stocks");
    expect(stocksShownLabel({ ...baseConfig, stocksPerRound: 8 })).toBe("8 stocks");
    expect(stocksShownLabel({ ...baseConfig, stocksPerRound: 10 })).toBe("10 stocks");
  });

  it("returns the right board label for every allowed value", () => {
    expect(boardLabel({ ...baseConfig, boardDistribution: "onePerIndustry" })).toBe("One stock per industry");
    expect(boardLabel({ ...baseConfig, boardDistribution: "any" })).toBe("Any industries");
    expect(boardLabel({ ...baseConfig, boardDistribution: "sameIndustry" })).toBe("All from one industry");
  });

  it("returns the right hold label for every allowed value", () => {
    expect(holdLabel({ ...baseConfig, holdYears: 3 })).toBe("3 years");
    expect(holdLabel({ ...baseConfig, holdYears: 5 })).toBe("5 years");
    expect(holdLabel({ ...baseConfig, holdYears: 10 })).toBe("10 years");
    expect(holdLabel({ ...baseConfig, holdYears: "indefinite" })).toBe("Until the game ends");
  });

  it("returns the right picks label for every allowed value", () => {
    expect(picksLabel({ ...baseConfig, pickDistribution: "onePerIndustry" })).toBe("One stock per industry");
    expect(picksLabel({ ...baseConfig, pickDistribution: "any" })).toBe("No limit");
  });

  it("returns the right selling label for every allowed value", () => {
    expect(sellingLabel({ ...baseConfig, selling: "none" })).toBe("Not allowed");
    expect(sellingLabel({ ...baseConfig, selling: "any" })).toBe("Sell any stock, anytime");
    expect(sellingLabel({ ...baseConfig, selling: "sameIndustry" })).toBe(
      "Sell, then replace from the same industry",
    );
  });

  it("uses each allocation rule's own numbers in the money label", () => {
    expect(moneyLabel({ ...baseConfig, allocation: { kind: "equal" } })).toBe(
      "Split evenly across your remaining picks",
    );
    expect(moneyLabel({ ...baseConfig, allocation: { kind: "range", min: 750, max: 12000 } })).toBe(
      "$750 to $12,000 per pick",
    );
    expect(moneyLabel({ ...baseConfig, allocation: { kind: "steps", percents: [5, 15, 35] } })).toBe(
      "5%, 15%, or 35% of your budget",
    );
    expect(moneyLabel({ ...baseConfig, allocation: { kind: "minPlusFree", min: 2500 } })).toBe(
      "At least $2,500, then as much as you want",
    );
  });

  it("formats dollar amounts with commas and no cents", () => {
    expect(moneyLabel({ ...baseConfig, allocation: { kind: "range", min: 500, max: 3000 } })).toBe(
      "$500 to $3,000 per pick",
    );
    expect(moneyLabel({ ...baseConfig, allocation: { kind: "minPlusFree", min: 12500 } })).toBe(
      "At least $12,500, then as much as you want",
    );
  });

  it("returns 7 rows in the documented order for each preset config", () => {
    for (const mode of PRESET_MODES) {
      const rows = configRows(mode.config);

      expect(rows).toHaveLength(7);
      expect(rows.map((row) => row.label)).toEqual([
        "Rounds",
        "Stocks shown",
        "Board",
        "Picks",
        "Money",
        "Hold time",
        "Selling",
      ]);
    }
  });
});