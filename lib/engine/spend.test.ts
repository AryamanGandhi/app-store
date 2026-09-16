import { describe, expect, it } from "vitest";
import { getSpendOptions } from "@/lib/engine";
import { isAmountAllowed } from "@/lib/engine/spend";
import {
  sampleConfigActive,
  sampleConfigBudgetBoss,
  sampleConfigClassic,
  sampleConfigOneShot,
  sampleSpendBlocked,
  sampleSpendEqual,
  sampleSpendMinPlusFree,
  sampleSpendRange,
  sampleSpendSteps,
  sampleStateRound1,
} from "@/lib/fixtures";
import type { GameConfig, GameState } from "@/lib/types";

const stateWith = (overrides: Partial<GameState>): GameState => ({ ...sampleStateRound1, ...overrides });

const classic = (round: number, cash: number) => stateWith({ round, cash });

const active = (round: number, cash: number) => stateWith({ round, cash, config: sampleConfigActive });

const oneShot = (round: number, cash: number) => stateWith({ round, cash, config: sampleConfigOneShot });

const budgetBoss = (round: number, cash: number) => stateWith({ round, cash, config: sampleConfigBudgetBoss });

describe("getSpendOptions against the shared samples", () => {
  it("matches every sample spend option in lib/fixtures.ts", () => {
    expect(getSpendOptions(classic(1, 10000))).toEqual(sampleSpendEqual);
    expect(getSpendOptions(active(1, 10000))).toEqual(sampleSpendRange);
    expect(getSpendOptions(oneShot(3, 5500))).toEqual(sampleSpendSteps);
    expect(getSpendOptions(budgetBoss(1, 9000))).toEqual(sampleSpendMinPlusFree);
    expect(getSpendOptions(active(7, 1800))).toEqual(sampleSpendBlocked);
  });
});

describe("getSpendOptions equal split", () => {
  it("splits the cash evenly at round 1", () => {
    expect(getSpendOptions(classic(1, 10000))).toEqual({
      kind: "equal",
      canBuy: true,
      min: 1250,
      max: 1250,
      fixedAmount: 1250,
      steps: [],
      reserved: 8750,
    });
  });

  it("keeps the same per-pick amount in a middle round", () => {
    const options = getSpendOptions(classic(4, 6250));

    expect(options.fixedAmount).toBe(1250);
    expect(options.reserved).toBe(5000);
  });

  it("rounds the per-pick amount down to the cent", () => {
    const options = getSpendOptions(stateWith({ config: { ...sampleConfigClassic, rounds: 6 }, round: 1, cash: 10000 }));

    expect(options.fixedAmount).toBe(1666.66);
    expect(options.reserved).toBe(8333.34);
  });

  it("gives a bigger per-pick amount after an auto-sell adds cash", () => {
    const before = getSpendOptions(classic(4, 6250));
    const after = getSpendOptions(classic(4, 7500));

    expect(before.fixedAmount).toBe(1250);
    expect(after.fixedAmount).toBe(1500);
    expect(after.fixedAmount).toBeGreaterThan(1250);
  });

  it("uses all remaining cash on the last round", () => {
    const options = getSpendOptions(classic(8, 1875.55));

    expect(options.fixedAmount).toBe(1875.55);
    expect(options.min).toBe(1875.55);
    expect(options.max).toBe(1875.55);
    expect(options.reserved).toBe(0);
  });

  it("cannot buy once the cash is gone", () => {
    expect(getSpendOptions(classic(8, 0)).canBuy).toBe(false);
  });

  it("floors the per-pick amount in integer cents, without dropping a cent", () => {
    expect(getSpendOptions(classic(7, 1.14)).fixedAmount).toBe(0.57);
    expect(getSpendOptions(classic(7, 2468.58)).fixedAmount).toBe(1234.29);
  });
});

describe("getSpendOptions range", () => {
  it("caps the maximum at the rule maximum at round 1", () => {
    const options = getSpendOptions(active(1, 10000));

    expect(options.min).toBe(500);
    expect(options.max).toBe(3000);
    expect(options.reserved).toBe(4500);
    expect(options.canBuy).toBe(true);
  });

  it("caps the maximum at what is left after the reserve in a middle round", () => {
    const options = getSpendOptions(active(5, 3250));

    expect(options.reserved).toBe(2500);
    expect(options.max).toBe(750);
    expect(options.canBuy).toBe(true);
  });

  it("cannot buy when the reserve cannot be met", () => {
    const options = getSpendOptions(active(5, 2500));

    expect(options.reserved).toBe(2500);
    expect(options.max).toBe(0);
    expect(options.canBuy).toBe(false);
  });

  it("drops the reserve on the last round", () => {
    const options = getSpendOptions(active(10, 1200));

    expect(options.reserved).toBe(0);
    expect(options.max).toBe(1200);
    expect(options.canBuy).toBe(true);
  });

  it("cannot buy on the last round when the minimum does not fit", () => {
    const options = getSpendOptions(active(10, 400));

    expect(options.max).toBe(400);
    expect(options.canBuy).toBe(false);
  });
});

describe("getSpendOptions set amounts", () => {
  it("enables every step that fits alongside the reserve for the other picks", () => {
    const options = getSpendOptions(oneShot(1, 10000));

    expect(options.kind).toBe("steps");
    expect(options.min).toBe(1000);
    expect(options.max).toBe(5000);
    expect(options.reserved).toBe(4000);
    expect(options.steps.map((step) => step.enabled)).toEqual([true, true, true, true, true]);
    expect(options.canBuy).toBe(true);
  });

  it("turns steps off once the reserve would be broken", () => {
    const options = getSpendOptions(oneShot(2, 7000));

    expect(options.reserved).toBe(3000);
    expect(options.max).toBe(4000);
    expect(options.steps).toEqual([
      { percent: 10, amount: 1000, enabled: true },
      { percent: 20, amount: 2000, enabled: true },
      { percent: 30, amount: 3000, enabled: true },
      { percent: 40, amount: 4000, enabled: true },
      { percent: 50, amount: 5000, enabled: false },
    ]);
  });

  it("drops the reserve on the last round", () => {
    const options = getSpendOptions(oneShot(5, 2500));

    expect(options.reserved).toBe(0);
    expect(options.max).toBe(2000);
    expect(options.canBuy).toBe(true);
  });

  it("cannot buy when no step fits the reserve", () => {
    const options = getSpendOptions(oneShot(4, 1500));

    expect(options.reserved).toBe(1000);
    expect(options.steps.every((step) => !step.enabled)).toBe(true);
    expect(options.canBuy).toBe(false);
  });

  it("keeps the smallest step as the minimum even when every step is turned off", () => {
    const options = getSpendOptions(oneShot(5, 500));

    expect(options.min).toBe(1000);
    expect(options.max).toBe(0);
    expect(options.canBuy).toBe(false);
  });
});

describe("getSpendOptions minimum plus any amount", () => {
  it("subtracts the reserve from the maximum at round 1", () => {
    const options = getSpendOptions(budgetBoss(1, 9000));

    expect(options.min).toBe(500);
    expect(options.max).toBe(6500);
    expect(options.reserved).toBe(2500);
    expect(options.canBuy).toBe(true);
  });

  it("drops the reserve on the last round", () => {
    const options = getSpendOptions(budgetBoss(6, 800));

    expect(options.reserved).toBe(0);
    expect(options.max).toBe(800);
    expect(options.canBuy).toBe(true);
  });

  it("cannot buy when the minimum no longer fits", () => {
    const options = getSpendOptions(budgetBoss(6, 400));

    expect(options.max).toBe(400);
    expect(options.canBuy).toBe(false);
  });
});

describe("getSpendOptions when the game is over", () => {
  it("offers nothing for any allocation kind", () => {
    for (const config of [sampleConfigClassic, sampleConfigActive, sampleConfigOneShot, sampleConfigBudgetBoss]) {
      const options = getSpendOptions({ ...classic(8, 500), config, status: "done" });

      expect(options.canBuy).toBe(false);
      expect(options.min).toBe(0);
      expect(options.max).toBe(0);
      expect(options.fixedAmount).toBeNull();
      expect(options.steps).toEqual([]);
      expect(options.reserved).toBe(0);
    }
  });

  it("does not throw on an allocation kind it does not know", () => {
    const allocation = { kind: "random" } as unknown as GameConfig["allocation"];
    const broken = stateWith({ config: { ...sampleConfigClassic, allocation } });

    expect(() => getSpendOptions(broken)).not.toThrow();
    expect(getSpendOptions(broken).canBuy).toBe(false);
  });
});

describe("isAmountAllowed", () => {
  it("accepts the equal amount and nothing else", () => {
    const options = getSpendOptions(classic(1, 10000));

    expect(isAmountAllowed(options, 1250)).toBe(true);
    expect(isAmountAllowed(options, 1250.01)).toBe(false);
    expect(isAmountAllowed(options, 1000)).toBe(false);
  });

  it("accepts every amount from the range minimum to the range maximum", () => {
    const options = getSpendOptions(active(1, 10000));

    expect(isAmountAllowed(options, 500)).toBe(true);
    expect(isAmountAllowed(options, 1800)).toBe(true);
    expect(isAmountAllowed(options, 3000)).toBe(true);
    expect(isAmountAllowed(options, 499.99)).toBe(false);
    expect(isAmountAllowed(options, 3000.01)).toBe(false);
    expect(isAmountAllowed(options, 5500)).toBe(false);
  });

  it("accepts only the step amounts that are turned on", () => {
    const options = getSpendOptions(oneShot(2, 7000));

    expect(isAmountAllowed(options, 4000)).toBe(true);
    expect(isAmountAllowed(options, 5000)).toBe(false);
    expect(isAmountAllowed(options, 2500)).toBe(false);
  });

  it("accepts any amount from the minimum up to the maximum", () => {
    const options = getSpendOptions(budgetBoss(1, 9000));

    expect(isAmountAllowed(options, 500)).toBe(true);
    expect(isAmountAllowed(options, 4321.5)).toBe(true);
    expect(isAmountAllowed(options, 6500)).toBe(true);
    expect(isAmountAllowed(options, 499)).toBe(false);
    expect(isAmountAllowed(options, 6500.01)).toBe(false);
  });

  it("rejects amounts that are not usable numbers", () => {
    const options = getSpendOptions(active(1, 10000));

    expect(isAmountAllowed(options, 0)).toBe(false);
    expect(isAmountAllowed(options, -500)).toBe(false);
    expect(isAmountAllowed(options, Number.NaN)).toBe(false);
    expect(isAmountAllowed(options, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("rejects amounts that are not whole cents", () => {
    const options = getSpendOptions(classic(1, 10000));

    expect(isAmountAllowed(options, 500.004)).toBe(false);
    expect(isAmountAllowed(options, 1250)).toBe(true);
  });

  it("rejects everything once the reserve cannot be met", () => {
    const options = getSpendOptions(active(5, 2500));

    expect(options.canBuy).toBe(false);
    expect(isAmountAllowed(options, 400)).toBe(false);
    expect(isAmountAllowed(options, 500)).toBe(false);
  });

  it("rejects everything once the game is over", () => {
    const options = getSpendOptions({ ...classic(8, 1250), status: "done" });

    expect(isAmountAllowed(options, 1250)).toBe(false);
  });

  it("rejects everything when no step is turned on", () => {
    const options = getSpendOptions(oneShot(4, 1500));

    expect(isAmountAllowed(options, 1000)).toBe(false);
    expect(isAmountAllowed(options, 5000)).toBe(false);
  });
});