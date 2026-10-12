import { describe, expect, it } from "vitest";
import { canSell, createGameReducer, describeConfig, getSpendOptions, startGame, validateConfig } from "@/lib/engine";
import { createTestMarket, sampleConfigActive, sampleConfigSwap } from "@/lib/fixtures";
import type { GameConfig, GameState } from "@/lib/types";

const market = createTestMarket({ perIndustry: 10, startYear: 2000, endYear: 2024 });
const reducer = createGameReducer(market);

function buyFirstPickable(state: GameState): GameState {
  const entry = state.board.find((candidate) => candidate.pickable)!;
  const amount = getSpendOptions(state).steps.find((step) => step.enabled)!.amount;
  return reducer(state, { type: "BUY", ticker: entry.stock.ticker, amount });
}

// Buys in round 1, then sells that stock in round 2 so a replacement is due.
function sellInRoundTwo(config: GameConfig): GameState {
  const roundTwo = buyFirstPickable(startGame(config, market, 42));
  return reducer(roundTwo, { type: "SELL", holdingId: roundTwo.holdings[0].id });
}

describe("swapKeepsPick", () => {
  it("is off by default, so buying the replacement ends the round", () => {
    const afterSale = sellInRoundTwo(sampleConfigSwap);
    const afterReplacement = buyFirstPickable(afterSale);

    expect(afterSale.mustReplaceIndustry).not.toBeNull();
    expect(afterReplacement.round).toBe(3);
    expect(afterReplacement.holdings).toHaveLength(1);
  });

  it("keeps the round going after the replacement, then the normal pick ends it", () => {
    const afterSale = sellInRoundTwo({ ...sampleConfigSwap, swapKeepsPick: true });
    const replacementIndustry = afterSale.mustReplaceIndustry;
    const afterReplacement = buyFirstPickable(afterSale);

    expect(afterReplacement.round).toBe(2);
    expect(afterReplacement.mustReplaceIndustry).toBeNull();
    expect(afterReplacement.holdings.map((holding) => holding.industry)).toEqual([replacementIndustry]);
    expect(afterReplacement.board.some((entry) => entry.pickable)).toBe(true);

    const afterPick = buyFirstPickable(afterReplacement);
    expect(afterPick.round).toBe(3);
    expect(afterPick.holdings).toHaveLength(2);
  });

  it("blocks buying the replacement stock again and a second sale in the same round", () => {
    const afterReplacement = buyFirstPickable(sellInRoundTwo({ ...sampleConfigSwap, swapKeepsPick: true }));
    const replacement = afterReplacement.holdings[0];
    const replacementCard = afterReplacement.board.find((entry) => entry.stock.ticker === replacement.ticker);

    expect(replacementCard).toMatchObject({ pickable: false, reason: "You just bought this stock." });
    const allowedAmount = getSpendOptions(afterReplacement).steps.find((step) => step.enabled)!.amount;

    expect(reducer(afterReplacement, { type: "BUY", ticker: replacement.ticker, amount: allowedAmount })).toBe(afterReplacement);
    expect(canSell(afterReplacement, replacement, market)).toEqual({ allowed: false, reason: "You can only sell one stock per round." });
  });

  it("lets the player skip the normal pick after the replacement", () => {
    const afterReplacement = buyFirstPickable(sellInRoundTwo({ ...sampleConfigSwap, swapKeepsPick: true }));
    const afterSkip = reducer(afterReplacement, { type: "SKIP" });

    expect(afterSkip.round).toBe(3);
    expect(afterSkip.holdings).toHaveLength(1);
  });
});

describe("swapKeepsPick config checks", () => {
  it("accepts it only with same-industry selling", () => {
    expect(validateConfig({ ...sampleConfigSwap, swapKeepsPick: true }).errors).toEqual([]);
    expect(validateConfig({ ...sampleConfigActive, swapKeepsPick: true }).errors).toEqual([
      { field: "swapKeepsPick", message: "Keeping the pick on a swap needs same-industry selling." },
    ]);
  });

  it("rejects a value that isn't on or off", () => {
    const config = { ...sampleConfigSwap, swapKeepsPick: "yes" } as unknown as GameConfig;
    expect(validateConfig(config).errors).toEqual([
      { field: "swapKeepsPick", message: "Keeping the pick on a swap must be on or off." },
    ]);
  });

  it("adds a line to the rule summary only when it's on", () => {
    expect(describeConfig({ ...sampleConfigSwap, swapKeepsPick: true })).toContain("Buying a replacement doesn't use your pick for the round.");
    expect(describeConfig(sampleConfigSwap)).toHaveLength(6);
  });
});
