import { describe, expect, it } from "vitest";
import { playGame } from "@/lib/lab/run";
import { churner, exitYear, hindsight, loyalist, STRATEGIES, type Strategy } from "@/lib/lab/strategies";
import { startGame } from "@/lib/engine";
import {
  createTestMarket,
  sampleConfigActive,
  sampleConfigBudgetBoss,
  sampleConfigClassic,
  sampleConfigSwap,
} from "@/lib/fixtures";
import type { Market } from "@/lib/types";

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

describe("exitYear", () => {
  it("ends at the hold when it comes before the last round, and at the last round otherwise", () => {
    const active = startGame(sampleConfigActive, market, 42);
    const classic = startGame(sampleConfigClassic, market, 42);
    const budgetBoss = startGame(sampleConfigBudgetBoss, market, 42);

    expect(exitYear(active)).toBe(active.year + 3);
    expect(exitYear(classic)).toBe(classic.startYear + 7);
    expect(exitYear(budgetBoss)).toBe(budgetBoss.startYear + 5);
  });
});

describe("hindsight", () => {
  it("always buys the pickable stock that gains the most by its exit year", () => {
    let checkedBuys = 0;
    const watched: Strategy = {
      ...hindsight,
      chooseAction(state, gameMarket, rng) {
        const action = hindsight.chooseAction(state, gameMarket, rng);
        const growth = (ticker: string) => gameMarket.prices[ticker][exitYear(state)] / gameMarket.prices[ticker][state.year];
        const bestGrowth = Math.max(...state.board.filter((entry) => entry.pickable).map((entry) => growth(entry.stock.ticker)));

        if (action.type === "BUY") {
          expect(growth(action.ticker)).toBe(bestGrowth);
          checkedBuys += 1;
        }

        return action;
      },
    };

    [1, 2, 3].forEach((seed) => playGame(sampleConfigActive, market, watched, seed));
    expect(checkedBuys).toBeGreaterThan(0);
  });

  it("skips every round and keeps its $10,000 when every price only falls", () => {
    const falling: Market = {
      ...market,
      prices: Object.fromEntries(market.stocks.map((stock) => [
        stock.ticker,
        Object.fromEntries(Array.from({ length: 25 }, (_, index) => [2000 + index, 100 - index])),
      ])),
    };
    const record = playGame(sampleConfigClassic, falling, hindsight, 42);

    expect(record.buys).toBe(0);
    expect(record.finalValue).toBe(10000);
  });
});

describe("readsFuture", () => {
  it("is set on Hindsight and on no other bot", () => {
    expect(STRATEGIES.filter((strategy) => strategy.readsFuture === true)).toEqual([hindsight]);
  });
});
