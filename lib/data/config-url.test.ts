import { describe, expect, it } from "vitest";

import { PRESET_MODES } from "@/lib/data/modes";
import { configToParams, paramsToConfig } from "@/lib/data/config-url";
import type { GameConfig } from "@/lib/types";

const roundTrip = (config: GameConfig) => paramsToConfig(new URLSearchParams(configToParams(config)));

describe("config-url", () => {
  it("round-trips all preset configs", () => {
    for (const mode of PRESET_MODES) {
      expect(roundTrip(mode.config)).toEqual(mode.config);
    }
  });

  it("round-trips custom configs covering all money kinds", () => {
    const customConfigs: GameConfig[] = [
      {
        rounds: 6,
        stocksPerRound: 5,
        holdYears: 3,
        boardDistribution: "any",
        pickDistribution: "any",
        allocation: { kind: "equal" },
        selling: "any",
        startingBudget: 10000,
      },
      {
        rounds: 10,
        stocksPerRound: 8,
        holdYears: 5,
        boardDistribution: "sameIndustry",
        pickDistribution: "any",
        allocation: { kind: "range", min: 750, max: 4250 },
        selling: "none",
        startingBudget: 10000,
      },
      {
        rounds: 5,
        stocksPerRound: 1,
        holdYears: "indefinite",
        boardDistribution: "onePerIndustry",
        pickDistribution: "onePerIndustry",
        allocation: { kind: "steps", percents: [7, 14, 21] },
        selling: "sameIndustry",
        startingBudget: 10000,
      },
      {
        rounds: 8,
        stocksPerRound: 5,
        holdYears: 10,
        boardDistribution: "any",
        pickDistribution: "any",
        allocation: { kind: "minPlusFree", min: 1250 },
        selling: "none",
        startingBudget: 10000,
      },
    ];

    for (const config of customConfigs) {
      expect(roundTrip(config)).toEqual(config);
    }
  });

  it("returns null when required keys are missing", () => {
    expect(paramsToConfig(new URLSearchParams())).toBeNull();
    expect(paramsToConfig(new URLSearchParams({ rounds: "8", stocks: "5" }))).toBeNull();
  });

  it("returns null for invalid values", () => {
    expect(
      paramsToConfig(
        new URLSearchParams({
          rounds: "7",
          stocks: "5",
          hold: "10",
          board: "onePerIndustry",
          picks: "onePerIndustry",
          money: "equal",
          sell: "none",
        }),
      ),
    ).toBeNull();

    expect(
      paramsToConfig(
        new URLSearchParams({
          rounds: "8",
          stocks: "5",
          hold: "20",
          board: "onePerIndustry",
          picks: "onePerIndustry",
          money: "equal",
          sell: "none",
        }),
      ),
    ).toBeNull();

    expect(
      paramsToConfig(
        new URLSearchParams({
          rounds: "8",
          stocks: "5",
          hold: "10",
          board: "banana",
          picks: "onePerIndustry",
          money: "equal",
          sell: "none",
        }),
      ),
    ).toBeNull();

    expect(
      paramsToConfig(
        new URLSearchParams({
          rounds: "8",
          stocks: "5",
          hold: "10",
          board: "onePerIndustry",
          picks: "onePerIndustry",
          money: "steps",
          sell: "none",
          steps: "abc",
        }),
      ),
    ).toBeNull();
  });

  it("ignores extra unknown keys", () => {
    const params = new URLSearchParams({
      rounds: "8",
      stocks: "5",
      hold: "10",
      board: "onePerIndustry",
      picks: "onePerIndustry",
      money: "equal",
      sell: "none",
      mystery: "wow",
    });

    expect(paramsToConfig(params)).toEqual(PRESET_MODES[0].config);
  });

  it("only includes money-specific keys for the selected money kind", () => {
    expect(configToParams({ ...PRESET_MODES[0].config, allocation: { kind: "equal" } })).toEqual({
      rounds: "8",
      stocks: "5",
      hold: "10",
      board: "onePerIndustry",
      picks: "onePerIndustry",
      money: "equal",
      sell: "none",
    });

    expect(configToParams(PRESET_MODES[3].config)).toEqual({
      rounds: "10",
      stocks: "10",
      hold: "3",
      board: "any",
      picks: "any",
      money: "range",
      min: "500",
      max: "3000",
      sell: "any",
    });

    expect(configToParams(PRESET_MODES[4].config)).toEqual({
      rounds: "8",
      stocks: "8",
      hold: "indefinite",
      board: "onePerIndustry",
      picks: "onePerIndustry",
      money: "steps",
      steps: "5,10,15,20,25",
      sell: "sameIndustry",
    });

    expect(configToParams(PRESET_MODES[2].config)).toEqual({
      rounds: "6",
      stocks: "8",
      hold: "indefinite",
      board: "onePerIndustry",
      picks: "any",
      money: "minPlusFree",
      min: "500",
      sell: "none",
    });
  });
});