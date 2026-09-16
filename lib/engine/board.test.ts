import { describe, expect, it } from "vitest";
import { INDUSTRIES } from "@/lib/constants";
import { drawBoard } from "@/lib/engine";
import { recomputePickability } from "@/lib/engine/board";
import {
  createTestMarket,
  sampleConfigActive,
  sampleConfigClassic,
  sampleConfigFocus,
  sampleStateBlocked,
  sampleStateGameOver,
  sampleStateMidGame,
  sampleStateReplace,
  sampleStateRound1,
  sampleStateSameIndustry,
} from "@/lib/fixtures";
import type { BoardEntry, GameConfig, GameState, Holding, Industry, Market } from "@/lib/types";

const market = createTestMarket({ perIndustry: 10, startYear: 2000, endYear: 2024 });
const smallMarket = createTestMarket({ perIndustry: 2, startYear: 2000, endYear: 2024 });

const sampleStates = [
  sampleStateRound1,
  sampleStateMidGame,
  sampleStateReplace,
  sampleStateSameIndustry,
  sampleStateBlocked,
  sampleStateGameOver,
];

const stockOf = (target: Market, ticker: string) => {
  const stock = target.stocks.find((candidate) => candidate.ticker === ticker);

  if (stock === undefined) {
    throw new Error(`No stock ${ticker} in this market`);
  }

  return stock;
};

const holdingOf = (target: Market, ticker: string, yearBought = 2000): Holding => {
  const stock = stockOf(target, ticker);

  return {
    id: `${ticker}-${yearBought}`,
    ticker,
    name: stock.name,
    industry: stock.industry,
    yearBought,
    amountSpent: 1000,
    shares: 1,
  };
};

// Owns the first stock of an industry, which is enough to block that industry for one-per-industry picks.
const holdingForIndustry = (target: Market, industry: Industry): Holding => {
  const stock = target.stocks.find((candidate) => candidate.industry === industry);

  if (stock === undefined) {
    throw new Error(`No stock in ${industry}`);
  }

  return holdingOf(target, stock.ticker);
};

const boardOf = (target: Market, year: number, tickers: string[]): BoardEntry[] =>
  tickers.map((ticker) => ({
    stock: stockOf(target, ticker),
    price: target.prices[ticker][year],
    pickable: true,
    reason: null,
  }));

const stateWith = (overrides: Partial<GameState>): GameState => ({ ...sampleStateRound1, ...overrides });

const tickersOf = (board: BoardEntry[]) => board.map((entry) => entry.stock.ticker);

const industriesOf = (board: BoardEntry[]) => board.map((entry) => entry.stock.industry);

describe("drawBoard board shapes", () => {
  it("draws five stocks from five different industries on Classic Draft's board", () => {
    const board = drawBoard(stateWith({ config: sampleConfigClassic }), market);

    expect(board).toHaveLength(5);
    expect(new Set(industriesOf(board)).size).toBe(5);
  });

  it("draws ten stocks from anywhere on Active Trader's board", () => {
    const board = drawBoard(stateWith({ config: sampleConfigActive }), market);

    expect(board).toHaveLength(10);
  });

  it("draws five stocks from one industry on Sector Focus's board", () => {
    const board = drawBoard(stateWith({ config: sampleConfigFocus }), market);

    expect(board).toHaveLength(5);
    expect(new Set(industriesOf(board)).size).toBe(1);
  });

  it("never repeats an industry on a one-per-industry board", () => {
    for (const seed of [11, 22, 33]) {
      for (let round = 1; round <= 8; round += 1) {
        const board = drawBoard(stateWith({ seed, round }), market);

        expect(new Set(industriesOf(board)).size).toBe(board.length);
      }
    }
  });

  it("uses that year's price for every entry", () => {
    const board = drawBoard(stateWith({ year: 2010 }), market);

    for (const entry of board) {
      expect(entry.price).toBe(market.prices[entry.stock.ticker][2010]);
    }
  });

  it("always offers the last unused industry on a one-per-industry board", () => {
    const lastUnused = INDUSTRIES[INDUSTRIES.length - 1];
    const holdings = INDUSTRIES.filter((industry) => industry !== lastUnused).map((industry) =>
      holdingForIndustry(market, industry),
    );
    const board = drawBoard(stateWith({ holdings }), market);

    expect(board).toHaveLength(1);
    expect(industriesOf(board)).toEqual([lastUnused]);
    expect(board[0].pickable).toBe(true);
  });
});

describe("drawBoard exclusions", () => {
  it("never includes an owned stock or a stock sold this round", () => {
    const configs: GameConfig[] = [sampleConfigClassic, sampleConfigActive, sampleConfigFocus];

    for (const config of configs) {
      for (let round = 1; round <= 8; round += 1) {
        const state = stateWith({
          config,
          round,
          holdings: [holdingOf(market, "TE01")],
          soldThisRound: ["EN01"],
        });
        const board = tickersOf(drawBoard(state, market));

        expect(board).not.toContain("TE01");
        expect(board).not.toContain("EN01");
      }
    }
  });

  it("uses the industry being replaced on a same-industry board", () => {
    const state = stateWith({
      config: sampleConfigFocus,
      mustReplaceIndustry: "Energy",
      soldThisRound: ["EN01"],
    });
    const board = drawBoard(state, market);

    expect(new Set(industriesOf(board))).toEqual(new Set(["Energy"]));
    expect(tickersOf(board)).not.toContain("EN01");
    expect(board.some((entry) => entry.pickable)).toBe(true);
  });

  it("shows fewer stocks when the industry runs out", () => {
    const state = stateWith({
      config: sampleConfigFocus,
      mustReplaceIndustry: "Energy",
      holdings: [holdingOf(smallMarket, "EN01")],
    });
    const board = drawBoard(state, smallMarket);

    expect(tickersOf(board)).toEqual(["EN02"]);
  });

  it("does not use an owned industry on a same-industry board with one-per-industry picks", () => {
    const config: GameConfig = { ...sampleConfigFocus, pickDistribution: "onePerIndustry" };
    const holdings = INDUSTRIES.filter((industry) => industry !== "Utilities").map((industry) =>
      holdingForIndustry(market, industry),
    );
    const board = drawBoard(stateWith({ config, holdings }), market);

    expect(board).toHaveLength(5);
    expect(new Set(industriesOf(board))).toEqual(new Set(["Utilities"]));
    expect(board.every((entry) => entry.pickable)).toBe(true);
  });
});

describe("drawBoard repeatability", () => {
  it("draws the same board for the same seed and round", () => {
    const state = stateWith({ seed: 77, round: 3 });

    expect(drawBoard(state, market)).toEqual(drawBoard(state, market));
  });

  it("draws a different board in a different round and for a different seed", () => {
    const state = stateWith({ seed: 77, round: 3 });
    const roundThree = tickersOf(drawBoard(state, market));

    expect(tickersOf(drawBoard({ ...state, round: 4 }, market))).not.toEqual(roundThree);
    expect(tickersOf(drawBoard({ ...state, seed: 78 }, market))).not.toEqual(roundThree);
  });
});

describe("drawBoard pickable flags and reasons", () => {
  it("leaves a board fully pickable when nothing blocks it", () => {
    const board = drawBoard(stateWith({}), market);

    expect(board.every((entry) => entry.pickable)).toBe(true);
    expect(board.every((entry) => entry.reason === null)).toBe(true);
  });

  it("keeps at least one pickable stock when the market still has one", () => {
    // An any-industry board with one-per-industry picks needs a fix-up to stay playable.
    const config: GameConfig = { ...sampleConfigActive, pickDistribution: "onePerIndustry" };
    const holdings = INDUSTRIES.slice(0, 6).map((industry) => holdingForIndustry(market, industry));

    for (let round = 1; round <= 10; round += 1) {
      const board = drawBoard(stateWith({ config, round, holdings, soldThisRound: ["EN01"] }), market);

      expect(board.some((entry) => entry.pickable)).toBe(true);
    }
  });

  it("gives stocks outside the replacement industry the replace reason", () => {
    const state = stateWith({
      config: sampleConfigActive,
      mustReplaceIndustry: "Energy",
      soldThisRound: ["EN01"],
    });
    const board = drawBoard(state, market);

    for (const entry of board) {
      if (entry.stock.industry === "Energy") {
        expect(entry).toMatchObject({ pickable: true, reason: null });
      } else {
        expect(entry).toMatchObject({ pickable: false, reason: "Replace your Energy stock first." });
      }
    }

    expect(board.some((entry) => entry.pickable)).toBe(true);
  });
});

describe("recomputePickability", () => {
  it("reproduces the flags and reasons in the shared sample states", () => {
    for (const state of sampleStates) {
      expect(recomputePickability(state, state.board)).toEqual(state.board);
    }
  });

  it("changes only pickable and reason", () => {
    const state = stateWith({ holdings: [holdingForIndustry(market, "Technology")] });
    const board = boardOf(market, state.year, ["TE01", "HE01", "EN01"]);
    const recomputed = recomputePickability({ ...state, soldThisRound: ["HE01"] }, board);

    expect(recomputed.map((entry) => entry.stock)).toEqual(board.map((entry) => entry.stock));
    expect(recomputed.map((entry) => entry.price)).toEqual(board.map((entry) => entry.price));
    expect(recomputed.map((entry) => entry.pickable)).toEqual([false, false, true]);
    expect(board.every((entry) => entry.pickable)).toBe(true);
  });

  it("blocks every stock in an owned industry when picks are one per industry", () => {
    const state = stateWith({ holdings: [holdingForIndustry(market, "Healthcare")] });
    const board = recomputePickability(state, boardOf(market, state.year, ["HE01", "HE02"]));

    expect(board).toEqual([
      expect.objectContaining({ pickable: false, reason: "You already own a Healthcare stock." }),
      expect.objectContaining({ pickable: false, reason: "You already own a Healthcare stock." }),
    ]);
  });

  it("allows two stocks from one industry when picks are not one per industry", () => {
    const state = stateWith({
      config: sampleConfigActive,
      holdings: [holdingForIndustry(market, "Healthcare")],
    });
    const board = recomputePickability(state, boardOf(market, state.year, ["HE02", "HE03"]));

    expect(board.every((entry) => entry.pickable)).toBe(true);
  });

  it("blocks a stock that was sold this round", () => {
    const state = stateWith({ soldThisRound: ["EN01"] });
    const board = recomputePickability(state, boardOf(market, state.year, ["EN01", "EN02"]));

    expect(board).toEqual([
      expect.objectContaining({ pickable: false, reason: "You sold this stock this round." }),
      expect.objectContaining({ pickable: true, reason: null }),
    ]);
  });

  it("only allows the replacement industry once a stock is being replaced", () => {
    const state = stateWith({ soldThisRound: ["EN01"], mustReplaceIndustry: "Energy" });
    const board = recomputePickability(state, boardOf(market, state.year, ["EN01", "EN02", "HE01"]));

    expect(board.map((entry) => entry.pickable)).toEqual([false, true, false]);
    expect(board[0].reason).toBe("You sold this stock this round.");
    expect(board[2].reason).toBe("Replace your Energy stock first.");
  });
});