import { describe, expect, it } from "vitest";
import { playGame } from "@/lib/lab/run";
import { churner, loyalist, type Strategy } from "@/lib/lab/strategies";
import { createTestMarket, sampleConfigActive, sampleConfigClassic, sampleConfigSwap } from "@/lib/fixtures";

const market = createTestMarket({ perIndustry: 10, startYear: 2000, endYear: 2024 });

describe("loyalist", () => {
  it("only ever buys from the industry of its oldest stock", () => {
    let checkedBuys = 0;
    const watched: Strategy = {
      ...loyalist,
      chooseAction(state, gameMarket, rng) {
        const action = loyalist.chooseAction(state, gameMarket, rng);
        const oldest = [...state.holdings].sort((a, b) => a.yearBought - b.yearBought)[0];

        if (action.type === "BUY" && oldest) {
          const bought = state.board.find((entry) => entry.stock.ticker === action.ticker);
          expect(bought?.stock.industry).toBe(oldest.industry);
          checkedBuys += 1;
        }

        return action;
      },
    };

    // Active Trader's 3-year hold sells the oldest stock mid-game, so the loyal industry can change.
    [1, 2, 3, 4, 5].forEach((seed) => playGame(sampleConfigActive, market, watched, seed));
    expect(checkedBuys).toBeGreaterThan(0);
  });

  it("gets one buy in Classic, where each industry can be drafted only once", () => {
    const record = playGame(sampleConfigClassic, market, loyalist, 42);

    expect(record.buys).toBe(1);
    expect(record.skips).toBe(7);
  });
});

describe("churner", () => {
  it("sells everything it can each round in Active Trader, so nothing lives long enough to auto-sell", () => {
    const record = playGame(sampleConfigActive, market, churner, 42);

    expect(record.buys).toBe(10);
    expect(record.sales).toBe(9);
    expect(record.autoSells).toBe(0);
  });

  it("holds one stock all game in Sector Swap, because each replacement uses that round's pick", () => {
    const record = playGame(sampleConfigSwap, market, churner, 42);

    expect(record.buys).toBe(8);
    expect(record.sales).toBe(7);
  });
});
