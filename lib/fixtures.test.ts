import { describe, expect, it } from "vitest";
import { INDUSTRIES, MARKET_END_YEAR, MARKET_START_YEAR, STARTING_BUDGET } from "@/lib/constants";
import {
  createTestMarket,
  sampleMarket,
  sampleStateBlocked,
  sampleStateGameOver,
  sampleStateMidGame,
  sampleStateReplace,
  sampleStateRound1,
  sampleStateSameIndustry,
} from "@/lib/fixtures";
import type { GameState } from "@/lib/types";

const states = [
  sampleStateRound1,
  sampleStateMidGame,
  sampleStateReplace,
  sampleStateSameIndustry,
  sampleStateBlocked,
  sampleStateGameOver,
];

describe("sampleMarket", () => {
  it("has 24 stocks, 3 per industry, unique tickers, and a price for every stock in every year from 2000 to 2024", () => {
    expect(sampleMarket.stocks).toHaveLength(24);

    const tickers = sampleMarket.stocks.map((stock) => stock.ticker);
    expect(new Set(tickers).size).toBe(24);

    for (const industry of INDUSTRIES) {
      expect(sampleMarket.stocks.filter((stock) => stock.industry === industry)).toHaveLength(3);
    }

    for (const stock of sampleMarket.stocks) {
      for (let year = MARKET_START_YEAR; year <= MARKET_END_YEAR; year += 1) {
        expect(sampleMarket.prices[stock.ticker][year]).toBeTypeOf("number");
      }
    }
  });
});

describe("createTestMarket", () => {
  it("creates the correct stock count and per-industry counts", () => {
    const market = createTestMarket({ perIndustry: 4, startYear: 2010, endYear: 2015 });

    expect(market.stocks).toHaveLength(INDUSTRIES.length * 4);

    for (const industry of INDUSTRIES) {
      expect(market.stocks.filter((stock) => stock.industry === industry)).toHaveLength(4);
    }
  });

  it("creates unique tickers", () => {
    const market = createTestMarket({ perIndustry: 6, startYear: 2001, endYear: 2003, seed: 7 });
    const tickers = market.stocks.map((stock) => stock.ticker);

    expect(new Set(tickers).size).toBe(tickers.length);
  });

  it("creates a price for every stock in every year", () => {
    const market = createTestMarket({ perIndustry: 2, startYear: 2005, endYear: 2008, seed: 9 });

    for (const stock of market.stocks) {
      for (let year = market.startYear; year <= market.endYear; year += 1) {
        expect(market.prices[stock.ticker][year]).toBeTypeOf("number");
        expect(market.prices[stock.ticker][year]).toBeGreaterThanOrEqual(5);
        expect(market.prices[stock.ticker][year]).toBeLessThanOrEqual(400);
      }
    }
  });

  it("returns the same output for the same seed", () => {
    const options = { perIndustry: 3, startYear: 2000, endYear: 2004, seed: 11 };

    expect(createTestMarket(options)).toEqual(createTestMarket(options));
  });
});

describe("sample fixtures", () => {
  it("every ticker in every sample board and holding exists in sampleMarket", () => {
    const tickers = new Set(sampleMarket.stocks.map((stock) => stock.ticker));

    for (const state of states) {
      for (const boardEntry of state.board) {
        expect(tickers.has(boardEntry.stock.ticker)).toBe(true);
      }

      for (const stateHolding of state.holdings) {
        expect(tickers.has(stateHolding.ticker)).toBe(true);
      }
    }
  });

  it("every board entry price matches sampleMarket for that state's year", () => {
    for (const state of states) {
      for (const boardEntry of state.board) {
        expect(boardEntry.price).toBe(sampleMarket.prices[boardEntry.stock.ticker][state.year]);
      }
    }
  });

  it("every non-pickable entry has a reason, and every pickable entry has a null reason", () => {
    for (const state of states) {
      for (const boardEntry of state.board) {
        if (boardEntry.pickable) {
          expect(boardEntry.reason).toBeNull();
        } else {
          expect(boardEntry.reason).toBeTypeOf("string");
          expect(boardEntry.reason).not.toHaveLength(0);
        }
      }
    }
  });

  it("sampleStateSameIndustry's board has exactly one industry", () => {
    expect(new Set(sampleStateSameIndustry.board.map((boardEntry) => boardEntry.stock.industry)).size).toBe(1);
  });

  it("tracks soldThisRound consistently across sample states", () => {
    expect(sampleStateReplace.soldThisRound).toEqual(["ORB"]);

    for (const state of states.filter((state) => state !== sampleStateReplace)) {
      expect(state.soldThisRound).toEqual([]);
    }
  });

  it("for each playing state, cash is between 0 and the starting budget", () => {
    const playingStates: GameState[] = [
      sampleStateRound1,
      sampleStateMidGame,
      sampleStateReplace,
      sampleStateSameIndustry,
      sampleStateBlocked,
    ];

    for (const state of playingStates) {
      expect(state.cash).toBeGreaterThanOrEqual(0);
      expect(state.cash).toBeLessThanOrEqual(STARTING_BUDGET);
    }

    expect(sampleStateGameOver.cash).toBeGreaterThanOrEqual(0);
  });
});