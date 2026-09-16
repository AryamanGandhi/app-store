import { describe, expect, it } from "vitest";
import { INDUSTRIES, STARTING_BUDGET } from "@/lib/constants";
import {
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
  it("has 24 stocks, 3 per industry, unique tickers, and a price for every stock in every year from 2000 to 2014", () => {
    expect(sampleMarket.stocks).toHaveLength(24);

    const tickers = sampleMarket.stocks.map((stock) => stock.ticker);
    expect(new Set(tickers).size).toBe(24);

    for (const industry of INDUSTRIES) {
      expect(sampleMarket.stocks.filter((stock) => stock.industry === industry)).toHaveLength(3);
    }

    for (const stock of sampleMarket.stocks) {
      for (let year = 2000; year <= 2014; year += 1) {
        expect(sampleMarket.prices[stock.ticker][year]).toBeTypeOf("number");
      }
    }
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

  it("for each playing state, cash is between 0 and the starting budget", () => {
    const playingStates: GameState[] = [
      sampleStateRound1,
      sampleStateMidGame,
      sampleStateReplace,
      sampleStateSameIndustry,
      sampleStateBlocked,
    ];

    // These are static preview fixtures, so we only assert that cash values stay within sane bounds.
    for (const state of playingStates) {
      expect(state.cash).toBeGreaterThanOrEqual(0);
      expect(state.cash).toBeLessThanOrEqual(STARTING_BUDGET);
    }

    expect(sampleStateGameOver.cash).toBeGreaterThanOrEqual(0);
  });
});