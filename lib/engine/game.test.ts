import { describe, expect, it } from "vitest";
import { ROUND_OPTIONS } from "@/lib/constants";
import { createGameReducer, drawBoard, getHoldingValue, getSpendOptions, startGame } from "@/lib/engine";
import {
  createTestMarket,
  sampleConfigActive,
  sampleConfigClassic,
  sampleConfigOneShot,
  sampleMarket,
  sampleStateBlocked,
  sampleStateGameOver,
  sampleStateReplace,
} from "@/lib/fixtures";
import type { GameAction, GameConfig, GameState, Holding } from "@/lib/types";

const reducer = createGameReducer(sampleMarket);

describe("startGame", () => {
  it("starts with the configured budget and a fresh board", () => {
    const state = startGame(sampleConfigClassic, sampleMarket, 42);

    expect(state).toEqual({
      config: sampleConfigClassic,
      seed: 42,
      startYear: state.year,
      year: state.startYear,
      round: 1,
      cash: 10000,
      holdings: [],
      board: drawBoard(state, sampleMarket),
      soldThisRound: [],
      mustReplaceIndustry: null,
      events: [],
      status: "playing",
    });
    expect(state.board).toHaveLength(5);
    expect(state.board.every((entry) => entry.pickable)).toBe(true);
    expect(startGame(sampleConfigClassic, sampleMarket, 42)).toEqual(state);
  });

  it("chooses years from the seed and always leaves room for all rounds", () => {
    for (const rounds of ROUND_OPTIONS) {
      const years = new Set<number>();

      for (let seed = 1; seed <= 200; seed += 1) {
        const state = startGame({ ...sampleConfigClassic, rounds }, sampleMarket, seed);
        expect(state.year).toBeGreaterThanOrEqual(sampleMarket.startYear);
        expect(state.year + rounds - 1).toBeLessThanOrEqual(sampleMarket.endYear);
        years.add(state.year);
      }

      expect(years.has(sampleMarket.startYear)).toBe(true);
      expect(years.has(sampleMarket.endYear - rounds + 1)).toBe(true);
    }
  });

  it("uses the only start year when the market exactly fits the game", () => {
    const market = createTestMarket({ perIndustry: 1, startYear: 2000, endYear: 2007 });
    expect(startGame(sampleConfigClassic, market, 42).startYear).toBe(2000);
  });

  it("throws a clear error when the market has too few years", () => {
    const market = createTestMarket({ perIndustry: 1, startYear: 2000, endYear: 2006 });
    expect(() => startGame(sampleConfigClassic, market, 42)).toThrow("Market has 7 years, but the game needs 8 rounds.");
  });

  it("replays the same game for the same seed", () => {
    const playEqualSplit = (seed: number) => {
      let state = startGame(sampleConfigClassic, sampleMarket, seed);

      while (state.status === "playing") {
        const amount = getSpendOptions(state).fixedAmount ?? 0;
        const pick = state.board.find((entry) => entry.pickable);
        state = pick
          ? reducer(state, { type: "BUY", ticker: pick.stock.ticker, amount })
          : reducer(state, { type: "SKIP" });
      }

      return state;
    };

    for (const seed of [1, 42, 777]) {
      expect(playEqualSplit(seed)).toEqual(playEqualSplit(seed));
    }

    expect(playEqualSplit(1)).not.toEqual(playEqualSplit(42));
  });
});

describe("BUY", () => {
  it("subtracts cash, keeps exact shares, and advances the round without mutating the input", () => {
    const state = startGame(sampleConfigClassic, sampleMarket, 42);
    const before = structuredClone(state);
    const { stock, price } = state.board[0];
    const next = reducer(state, { type: "BUY", ticker: stock.ticker, amount: 1250 });

    expect(next.cash).toBe(8750);
    expect(next.holdings).toEqual([{
      ...stock,
      id: `${stock.ticker}-${state.year}`,
      yearBought: state.year,
      amountSpent: 1250,
      shares: 1250 / price,
    }]);
    expect(next.round).toBe(2);
    expect(next.year).toBe(state.year + 1);
    expect(next.board).toEqual(drawBoard(next, sampleMarket));
    expect(next.board.some((entry) => entry.stock.ticker === stock.ticker)).toBe(false);
    expect(state).toEqual(before);
  });

  it("rejects a non-pickable stock without changing the state", () => {
    const entry = sampleStateBlocked.board.find((candidate) => !candidate.pickable)!;
    const amount = getSpendOptions(sampleStateBlocked).fixedAmount!;
    expect(reducer(sampleStateBlocked, { type: "BUY", ticker: entry.stock.ticker, amount })).toBe(sampleStateBlocked);
  });

  it("rejects stocks outside the board, including unknown tickers", () => {
    const state = startGame(sampleConfigClassic, sampleMarket, 42);
    const offBoard = sampleMarket.stocks.find((stock) => !state.board.some((entry) => entry.stock.ticker === stock.ticker))!;

    for (const ticker of [offBoard.ticker, "UNKNOWN"]) {
      expect(reducer(state, { type: "BUY", ticker, amount: 1250 })).toBe(state);
    }
  });

  it.each([0, -500, 499.99, 3000.01, 500.004, Number.NaN, Infinity, -Infinity])(
    "rejects disallowed amount %s before rounding",
    (amount) => {
      const state = startGame(sampleConfigActive, sampleMarket, 42);
      expect(reducer(state, { type: "BUY", ticker: state.board[0].stock.ticker, amount })).toBe(state);
    },
  );

  it("rejects amounts outside an equal split or the enabled steps", () => {
    for (const config of [sampleConfigClassic, sampleConfigOneShot]) {
      const state = startGame(config, sampleMarket, 42);
      expect(reducer(state, { type: "BUY", ticker: state.board[0].stock.ticker, amount: 1500 })).toBe(state);
    }
  });

  it("rejects buying when the reserve leaves no allowed amount", () => {
    const state = { ...startGame(sampleConfigActive, sampleMarket, 42), cash: 100 };
    expect(reducer(state, { type: "BUY", ticker: state.board[0].stock.ticker, amount: 500 })).toBe(state);
  });

  it("stores bought amounts and cash rounded to cents", () => {
    const state = startGame(sampleConfigActive, sampleMarket, 42);
    const next = reducer(state, { type: "BUY", ticker: state.board[0].stock.ticker, amount: 1234.29 + 1e-10 });
    expect(next.holdings[0].amountSpent).toBe(1234.29);
    expect(next.cash).toBe(8765.71);
  });

  it("clears a required replacement before drawing the next board", () => {
    const next = reducer(sampleStateReplace, { type: "BUY", ticker: "ZEN", amount: 1000 });
    expect(next.round).toBe(sampleStateReplace.round + 1);
    expect(next.mustReplaceIndustry).toBeNull();
    expect(next.soldThisRound).toEqual([]);
    expect(next.events).toEqual([]);
    expect(next.board.every((entry) => entry.pickable)).toBe(true);
  });
});

describe("SKIP and game completion", () => {
  it("advances the year and round, clearing events and sold tickers", () => {
    const state: GameState = {
      ...startGame(sampleConfigClassic, sampleMarket, 42),
      soldThisRound: ["QNT"],
      events: [{ id: "old", kind: "sell", message: "Previous sale." }],
    };
    const next = reducer(state, { type: "SKIP" });
    expect(next.round).toBe(2);
    expect(next.year).toBe(state.year + 1);
    expect(next.cash).toBe(state.cash);
    expect(next.holdings).toEqual([]);
    expect(next.events).toEqual([]);
    expect(next.soldThisRound).toEqual([]);
    expect(next.board).toEqual(drawBoard(next, sampleMarket));
  });

  it("rejects skipping while an industry must be replaced", () => {
    expect(reducer(sampleStateReplace, { type: "SKIP" })).toBe(sampleStateReplace);
  });

  it.each(["BUY", "SKIP"] as const)("ends on the last %s, preserving its year and clearing the board and sold tickers", (type) => {
    let state = startGame(sampleConfigClassic, sampleMarket, 42);
    for (let round = 1; round < state.config.rounds; round += 1) {
      state = reducer(state, { type: "SKIP" });
      expect(state.status).toBe("playing");
    }

    state = { ...state, soldThisRound: ["old"] };
    const action: GameAction = type === "BUY"
      ? { type, ticker: state.board[0].stock.ticker, amount: state.cash }
      : { type };
    const next = reducer(state, action);

    expect(next.status).toBe("done");
    expect(next.round).toBe(state.config.rounds);
    expect(next.year).toBe(state.startYear + state.config.rounds - 1);
    expect(next.board).toEqual([]);
    expect(next.soldThisRound).toEqual([]);
    expect(next.holdings).toHaveLength(type === "BUY" ? 1 : 0);
  });
});

describe("holding values and automatic sales", () => {
  it("values shares at the requested year's price, rounded to cents", () => {
    const stock = sampleMarket.stocks[0];
    const holding: Holding = { ...stock, id: "test", yearBought: 2000, amountSpent: 1000, shares: 1.234567 };
    for (const year of [2000, 2005, 2024]) {
      expect(getHoldingValue(holding, sampleMarket, year)).toBe(Math.round(holding.shares * sampleMarket.prices[stock.ticker][year] * 100) / 100);
    }
  });

  it.each([3, 5] as const)("sells a %s-year hold exactly when it expires, using the new year's value", (holdYears) => {
    const market = createTestMarket({ perIndustry: 2, startYear: 2000, endYear: 2009 });
    const config: GameConfig = { ...sampleConfigActive, holdYears, stocksPerRound: 8, boardDistribution: "onePerIndustry", pickDistribution: "onePerIndustry" };
    const reduce = createGameReducer(market);
    let state = startGame(config, market, 42);
    const stock = state.board[0].stock;
    market.prices[stock.ticker][2000] = 100;
    market.prices[stock.ticker][2000 + holdYears] = 184.049;
    state = reduce(state, { type: "BUY", ticker: stock.ticker, amount: 1000 });

    while (state.year < 2000 + holdYears) {
      expect(state.holdings).toHaveLength(1);
      expect(state.cash).toBe(9000);
      expect(state.events).toEqual([]);
      state = reduce(state, { type: "SKIP" });
    }

    expect(state.holdings).toEqual([]);
    expect(state.cash).toBe(10840.49);
    expect(state.events).toEqual([{
      id: expect.any(String),
      kind: "autoSell",
      message: `${stock.name}'s hold ended, sold for $1,840.`,
    }]);
    expect(state.soldThisRound).toEqual([]);
    expect(state.board.find((entry) => entry.stock.industry === stock.industry)?.pickable).toBe(true);
    const next = reduce(state, { type: "SKIP" });
    expect(next.events).toEqual([]);
    expect(next.cash).toBe(state.cash);
  });

  it("sells every expired holding, keeps younger holdings, and uses distinct event ids", () => {
    const market = createTestMarket({ perIndustry: 1, startYear: 2000, endYear: 2009 });
    const state = startGame(sampleConfigActive, market, 42);
    state.round = 5;
    state.year = 2004;
    state.cash = 0.1;
    state.holdings = market.stocks.slice(0, 3).map((stock, index) => ({
      ...stock, id: `${stock.ticker}-${index}`, yearBought: 2001 + index, amountSpent: 100, shares: 1,
    }));
    market.prices[state.holdings[0].ticker][2005] = 1234.29;
    market.prices[state.holdings[1].ticker][2005] = 605.71;
    const before = structuredClone(state);
    const next = createGameReducer(market)(state, { type: "SKIP" });

    expect(next.cash).toBe(1840.1);
    expect(next.holdings).toEqual([state.holdings[2]]);
    expect(next.events.map((event) => event.message)).toEqual([
      `${state.holdings[0].name}'s hold ended, sold for $1,234.`,
      `${state.holdings[1].name}'s hold ended, sold for $606.`,
    ]);
    expect(new Set(next.events.map((event) => event.id)).size).toBe(2);
    expect(state).toEqual(before);
  });

  it.each(["indefinite", 10] as const)("keeps %s holds through the final round without an extra year's auto-sale", (holdYears) => {
    const config: GameConfig = { ...sampleConfigActive, holdYears };
    let state = startGame(config, sampleMarket, 42);
    state = reducer(state, { type: "BUY", ticker: state.board[0].stock.ticker, amount: 1000 });
    const holding = state.holdings[0];

    while (state.status === "playing") {
      state = reducer(state, { type: "SKIP" });
      expect(state.holdings).toEqual([holding]);
      expect(state.cash).toBe(9000);
      expect(state.events).toEqual([]);
    }
  });
});

describe("restart and inactive actions", () => {
  it.each([sampleStateReplace, sampleStateGameOver])("restarts round $round with the same config and a new seed", (state) => {
    const next = reducer(state, { type: "RESTART", seed: 12345 });
    expect(next).toEqual(startGame(state.config, sampleMarket, 12345));
    expect(next.config).toBe(state.config);
    expect(next).not.toBe(state);
  });

  it("ignores buys, skips, and sells after the game ends", () => {
    const actions: GameAction[] = [
      { type: "BUY", ticker: "QNT", amount: 250 },
      { type: "SKIP" },
      { type: "SELL", holdingId: sampleStateGameOver.holdings[0].id },
    ];
    for (const action of actions) {
      expect(reducer(sampleStateGameOver, action)).toBe(sampleStateGameOver);
    }
  });

  it("leaves SELL unchanged for both existing and unknown holdings", () => {
    for (const holdingId of [sampleStateReplace.holdings[0].id, "unknown"]) {
      expect(reducer(sampleStateReplace, { type: "SELL", holdingId })).toBe(sampleStateReplace);
    }
  });
});
