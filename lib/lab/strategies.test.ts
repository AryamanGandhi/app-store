import { describe, expect, it } from "vitest";
import { playGame } from "@/lib/lab/run";
import { bigSpender, churner, exitYear, hindsight, loyalist, noteTaker, pennyPincher, randomPlayer, STRATEGIES, type SeenPrices, type Strategy } from "@/lib/lab/strategies";
import { createRng } from "@/lib/random";
import { getSpendOptions, startGame } from "@/lib/engine";
import {
  createTestMarket,
  sampleConfigActive,
  sampleConfigBudgetBoss,
  sampleConfigClassic,
  sampleConfigOneShot,
  sampleConfigSwap,
} from "@/lib/fixtures";
import type { Market } from "@/lib/types";

const market = createTestMarket({ perIndustry: 10, startYear: 2000, endYear: 2024 });

describe("loyalist", () => {
  it("only ever buys from the industry of its oldest stock", () => {
    let checkedBuys = 0;
    const watched: Strategy = {
      ...loyalist,
      chooseAction(state, gameMarket, rng, seen) {
        const action = loyalist.chooseAction(state, gameMarket, rng, seen);
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
      chooseAction(state, gameMarket, rng, seen) {
        const action = hindsight.chooseAction(state, gameMarket, rng, seen);
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

describe("noteTaker", () => {
  const initial = startGame(sampleConfigActive, market, 42);
  const board = initial.board.slice(0, 3).map((entry) => ({ ...entry, pickable: true }));
  const state = { ...initial, board, year: 2010 };
  const [a, b, c] = board.map((entry) => entry.stock.ticker);
  const choose = (seen: SeenPrices) => noteTaker.chooseAction(state, market, createRng(7), seen);

  it("uses earliest and latest years and annualizes growth", () => {
    expect(choose({
      [a]: { 2000: 100, 2005: 10000, 2010: 400 },
      [b]: { 2008: 100, 2010: 200 },
      [c]: { 2010: 100 },
    })).toEqual({ type: "BUY", ticker: b, amount: getSpendOptions(state).max });
  });

  it("breaks trend ties in board order", () => {
    expect(choose({ [b]: { 2009: 100, 2010: 200 }, [a]: { 2009: 50, 2010: 100 } }))
      .toEqual({ type: "BUY", ticker: a, amount: getSpendOptions(state).max });
  });

  it("ignores blocked entries and buys even a falling trend", () => {
    const blocked = { ...state, board: [{ ...board[0], pickable: false }, board[1], board[2]] };
    expect(noteTaker.chooseAction(blocked, market, createRng(7), {
      [a]: { 2009: 1, 2010: 100 }, [b]: { 2009: 100, 2010: 90 },
    })).toEqual({ type: "BUY", ticker: b, amount: getSpendOptions(blocked).max });
  });

  it("falls back to the same random pick as Big spender", () => {
    const seen: SeenPrices = { [a]: { 2010: 100 }, [b]: {}, [c]: { 2009: 50 } };
    for (const seed of [1, 2, 3, 4, 5]) {
      expect(noteTaker.chooseAction(state, market, createRng(seed), seen))
        .toEqual(bigSpender.chooseAction(state, market, createRng(seed), seen));
    }
  });

  it("makes the same moves as Big spender on one-stock boards", () => {
    for (const seed of [1, 2, 42]) {
      expect(playGame(sampleConfigOneShot, market, noteTaker, seed).moves)
        .toBe(playGame(sampleConfigOneShot, market, bigSpender, seed).moves);
    }
  });

  it("buys the largest amount under each allocation rule", () => {
    for (const config of [sampleConfigClassic, sampleConfigActive, sampleConfigSwap, sampleConfigBudgetBoss]) {
      const game = startGame(config, market, 42);
      const options = getSpendOptions(game);
      expect(noteTaker.chooseAction(game, market, createRng(7), {})).toMatchObject({
        type: "BUY", amount: options.fixedAmount ?? options.max,
      });
    }
  });

  it("skips with no money or no pickable entries", () => {
    for (const game of [{ ...state, cash: 0 }, { ...state, board: [] }, {
      ...state, board: board.map((entry) => ({ ...entry, pickable: false })),
    }]) {
      expect(noteTaker.chooseAction(game, market, createRng(7), {})).toEqual({ type: "SKIP" });
    }
  });

  it("never sells in Active Trader", () => {
    const record = playGame(sampleConfigActive, market, noteTaker, 42);
    expect(record.buys).toBeGreaterThan(0);
    expect(record.sales).toBe(0);
  });

  it("decides from seen prices without accessing market prices", () => {
    const guarded: Market = {
      ...market,
      get prices(): Market["prices"] { throw new Error("Unseen prices"); },
    };
    expect(noteTaker.chooseAction(state, guarded, createRng(7), {
      [b]: { 2008: 100, 2010: 200 },
    })).toEqual({ type: "BUY", ticker: b, amount: getSpendOptions(state).max });
  });
});

describe("STRATEGIES", () => {
  it("puts Note taker before Hindsight", () => {
    expect(STRATEGIES).toEqual([randomPlayer, bigSpender, pennyPincher, loyalist, churner, noteTaker, hindsight]);
    expect(noteTaker.name).toBe("Note taker");
    expect(noteTaker.description.trim()).not.toBe("");
  });

  it("marks only Note taker as reading past prices", () => {
    expect(STRATEGIES.filter((strategy) => strategy.readsPastPrices === true)).toEqual([noteTaker]);
  });
});
