import { describe, expect, it } from "vitest";
import { canSell, createGameReducer, drawBoard, getSpendOptions, startGame } from "@/lib/engine";
import { recomputePickability } from "@/lib/engine/board";
import {
  createTestMarket,
  sampleConfigActive,
  sampleConfigSwap,
  sampleMarket,
  sampleStateBlocked,
  sampleStateGameOver,
  sampleStateMidGame,
} from "@/lib/fixtures";
import type { AllocationRule, GameState, Market } from "@/lib/types";

const reducer = createGameReducer(sampleMarket);

function withBoard(state: GameState, tickers: string[], market: Market = sampleMarket): GameState {
  const board = tickers.map((ticker) => ({
    stock: market.stocks.find((stock) => stock.ticker === ticker)!,
    price: market.prices[ticker][state.year],
    pickable: true,
    reason: null,
  }));

  return { ...state, board: recomputePickability(state, board) };
}

describe("canSell", () => {
  const holding = sampleStateMidGame.holdings[0];

  it("checks disabled selling before game status and ownership", () => {
    const state: GameState = { ...sampleStateMidGame, config: sampleStateBlocked.config, status: "done", holdings: [] };
    expect(canSell(state, holding, sampleMarket)).toEqual({ allowed: false, reason: "This mode doesn't allow selling." });
  });

  it("checks game status before ownership", () => {
    const state: GameState = { ...sampleStateMidGame, status: "done", holdings: [] };
    expect(canSell(state, holding, sampleMarket)).toEqual({ allowed: false, reason: "The game is over." });
  });

  it("checks ownership by id before a pending replacement", () => {
    const state: GameState = { ...sampleStateMidGame, mustReplaceIndustry: "Energy" };
    expect(canSell(state, { ...holding, id: "unknown" }, sampleMarket)).toEqual({
      allowed: false, reason: "You no longer own this stock.",
    });
  });

  it("checks a pending replacement before the round sale limit", () => {
    const state: GameState = {
      ...sampleStateMidGame, config: sampleConfigSwap, mustReplaceIndustry: "Energy", soldThisRound: ["ORB"],
    };
    expect(canSell(state, holding, sampleMarket)).toEqual({ allowed: false, reason: "Replace your Energy stock first." });
    expect(canSell({ ...state, config: sampleConfigActive }, holding, sampleMarket)).toEqual({
      allowed: false, reason: "Replace your Energy stock first.",
    });
  });

  it("checks the round sale limit before replacement affordability", () => {
    const state: GameState = { ...sampleStateMidGame, config: sampleConfigSwap, soldThisRound: ["ORB"], cash: 0 };
    expect(canSell(state, holding, sampleMarket)).toEqual({ allowed: false, reason: "You can only sell one stock per round." });
    expect(reducer(state, { type: "SELL", holdingId: holding.id })).toBe(state);
  });

  it("blocks a same-industry sale when the industry has no replacement left", () => {
    const market = createTestMarket({ perIndustry: 1, startYear: 2000, endYear: 2024 });
    const owned = market.stocks.find((stock) => stock.industry === "Energy")!;
    const onlyEnergyHolding = { ...owned, id: "only-energy", yearBought: 2000, amountSpent: 500, shares: 2 };
    const state: GameState = {
      ...startGame(sampleConfigSwap, market, 42),
      holdings: [onlyEnergyHolding],
    };

    expect(canSell(state, onlyEnergyHolding, market)).toEqual({
      allowed: false, reason: "There are no other Energy stocks left to buy.",
    });
    expect(createGameReducer(market)(state, { type: "SELL", holdingId: onlyEnergyHolding.id })).toBe(state);
  });

  it("allows unrestricted selling even when replacement spending would be unaffordable", () => {
    const state = { ...sampleStateMidGame, cash: 0, soldThisRound: ["ORB"] };
    const before = structuredClone(state);
    expect(canSell(state, holding, sampleMarket)).toEqual({ allowed: true, reason: null });
    expect(state).toEqual(before);
  });
});

describe("SELL", () => {
  it.each([sampleStateBlocked, { ...sampleStateGameOver, config: sampleConfigActive }])("rejects selling when the mode or status disallows it", (state) => {
    expect(reducer(state, { type: "SELL", holdingId: state.holdings[0].id })).toBe(state);
  });

  it("rejects an unknown holding without changing the state", () => {
    expect(reducer(sampleStateMidGame, { type: "SELL", holdingId: "unknown" })).toBe(sampleStateMidGame);
  });

  it.each<AllocationRule>([
    { kind: "equal" },
    { kind: "range", min: 500, max: 3000 },
    { kind: "steps", percents: [5, 10, 15] },
    { kind: "minPlusFree", min: 500 },
  ])("checks replacement affordability using $kind spending rules and sale proceeds", (allocation) => {
    const market = createTestMarket({ perIndustry: 3, startYear: 2000, endYear: 2009 });
    const stock = market.stocks[0];
    const state: GameState = {
      ...startGame({ ...sampleConfigSwap, allocation }, market, 42),
      cash: 0,
      holdings: [{ ...stock, id: "held", yearBought: 2000, amountSpent: 500, shares: 1 }],
    };
    const reduce = createGameReducer(market);
    market.prices[stock.ticker][state.year] = 0.01;
    expect(canSell(state, state.holdings[0], market)).toEqual({
      allowed: false, reason: "You wouldn't have enough cash to buy a replacement.",
    });
    expect(reduce(state, { type: "SELL", holdingId: "held" })).toBe(state);

    market.prices[stock.ticker][state.year] = 4000;
    expect(getSpendOptions(state).canBuy).toBe(false);
    expect(canSell(state, state.holdings[0], market)).toEqual({ allowed: true, reason: null });
    const next = reduce(state, { type: "SELL", holdingId: "held" });
    expect(next).not.toBe(state);
    expect(next.cash).toBe(4000);
    expect(getSpendOptions(next).canBuy).toBe(true);
  });

  it("uses the current year's value and rounds proceeds and cash to cents without ending the round", () => {
    const market = createTestMarket({ perIndustry: 3, startYear: 2000, endYear: 2009 });
    const stock = market.stocks[0];
    market.prices[stock.ticker][2000] = 100;
    market.prices[stock.ticker][2001] = 184.049;
    const state: GameState = {
      ...startGame(sampleConfigActive, market, 42),
      round: 2,
      year: 2001,
      cash: 0.1,
      holdings: [{ ...stock, id: "held", yearBought: 2000, shares: 10, amountSpent: 1000 }],
    };
    const before = structuredClone(state);
    const next = createGameReducer(market)(state, { type: "SELL", holdingId: "held" });

    expect(next.cash).toBe(1840.59);
    expect(next.holdings).toEqual([]);
    expect(next.soldThisRound).toEqual([stock.ticker]);
    expect(next.events).toEqual([{
      id: expect.any(String), kind: "sell", message: `Sold ${stock.name} for $1,840.`,
    }]);
    expect(next.round).toBe(state.round);
    expect(next.year).toBe(state.year);
    expect(next.status).toBe("playing");
    expect(next.mustReplaceIndustry).toBeNull();
    expect(state).toEqual(before);
  });

  it("allows several unrestricted sales and keeps board stocks and prices while reopening industries", () => {
    let state = withBoard({
      ...sampleStateBlocked,
      config: { ...sampleStateBlocked.config, selling: "any" },
    }, ["QNT", "LMX", "NVA", "ELM", "HAR"]);
    const originalBoard = state.board.map(({ stock, price }) => ({ stock, price }));
    const holdings = [...state.holdings];

    for (const holding of holdings) {
      const next = reducer(state, { type: "SELL", holdingId: holding.id });
      expect(next).not.toBe(state);
      expect(next.round).toBe(state.round);
      expect(next.board.map(({ stock, price }) => ({ stock, price }))).toEqual(originalBoard);
      expect(next.board).toEqual(recomputePickability(next, state.board));
      state = next;
    }

    expect(state.holdings).toEqual([]);
    expect(state.soldThisRound).toEqual(holdings.map((holding) => holding.ticker));
    expect(state.board.filter((entry) => entry.pickable).map((entry) => entry.stock.ticker)).toEqual(["LMX", "ELM", "HAR"]);
    expect(state.events).toHaveLength(holdings.length);
    expect(new Set(state.events.map((event) => event.id)).size).toBe(holdings.length);
  });

  it("blocks rebuying a sold stock until the next round", () => {
    const state = withBoard(sampleStateMidGame, ["QNT", "LMX", "ELM"]);
    const next = reducer(state, { type: "SELL", holdingId: state.holdings[0].id });
    expect(next.board[0]).toMatchObject({ pickable: false, reason: "You sold this stock this round." });
    expect(reducer(next, { type: "BUY", ticker: "QNT", amount: 500 })).toBe(next);
    expect(reducer(next, { type: "SELL", holdingId: state.holdings[0].id })).toBe(next);

    const followingRound = reducer(next, { type: "SKIP" });
    expect(followingRound.soldThisRound).toEqual([]);
    expect(withBoard(followingRound, ["QNT"]).board[0].pickable).toBe(true);
  });

  it("requires a same-industry replacement through the normal spending and buy rules", () => {
    const state = withBoard({ ...sampleStateMidGame, config: sampleConfigSwap }, ["LMX", "ELM", "HAR"]);
    const sold = reducer(state, { type: "SELL", holdingId: state.holdings[0].id });
    expect(sold.mustReplaceIndustry).toBe("Technology");
    expect(sold.round).toBe(state.round);
    expect(sold.board.map((entry) => entry.stock.ticker)).toEqual(["LMX", "ELM", "HAR"]);
    expect(getSpendOptions(sold).canBuy).toBe(true);
    expect(reducer(sold, { type: "SKIP" })).toBe(sold);
    expect(reducer(sold, { type: "SELL", holdingId: sold.holdings[0].id })).toBe(sold);
    expect(reducer(sold, { type: "BUY", ticker: "ELM", amount: 500 })).toBe(sold);
    expect(reducer(sold, { type: "BUY", ticker: "LMX", amount: 501 })).toBe(sold);

    const bought = reducer(sold, { type: "BUY", ticker: "LMX", amount: 500 });
    expect(bought.holdings.some((holding) => holding.ticker === "LMX")).toBe(true);
    expect(bought.mustReplaceIndustry).toBeNull();
    expect(bought.soldThisRound).toEqual([]);
    expect(bought.round).toBe(state.round + 1);
    expect(bought.year).toBe(state.year + 1);
  });

  it("redraws a same-industry board from the replacement industry with a repeatable distinct draw", () => {
    const market = createTestMarket({ perIndustry: 10, startYear: 2000, endYear: 2024 });
    const holding = { ...market.stocks[0], id: "held", yearBought: 2000, amountSpent: 500, shares: 2 };
    const state = withBoard({
      ...startGame({ ...sampleConfigSwap, boardDistribution: "sameIndustry", stocksPerRound: 5 }, market, 42),
      holdings: [holding],
    }, market.stocks.filter((stock) => stock.industry === "Energy").slice(0, 5).map((stock) => stock.ticker), market);
    const reduce = createGameReducer(market);
    const action = { type: "SELL", holdingId: holding.id } as const;
    const next = reduce(state, action);

    expect(next.board).toHaveLength(5);
    expect(next.board.every((entry) => entry.stock.industry === "Technology" && entry.pickable)).toBe(true);
    expect(next.board.some((entry) => entry.stock.ticker === holding.ticker)).toBe(false);
    expect(next.board.every((entry) => entry.price === market.prices[entry.stock.ticker][next.year])).toBe(true);
    expect(reduce(state, action)).toEqual(next);
    expect(next.board).not.toEqual(drawBoard(next, market));
  });

  it.each(["any", "onePerIndustry"] as const)("swaps an eligible replacement into a non-pickable entry on a %s board", (boardDistribution) => {
    const state = withBoard({
      ...sampleStateMidGame,
      config: { ...sampleConfigSwap, boardDistribution },
      holdings: [sampleStateMidGame.holdings[0], {
        ...sampleStateMidGame.holdings[0],
        ...sampleMarket.stocks.find((stock) => stock.ticker === "LMX")!,
        id: "owned-lmx",
      }],
    }, ["QNT", "ELM", "HAR"]);
    const before = structuredClone(state);
    const action = { type: "SELL", holdingId: state.holdings[0].id } as const;
    const next = reducer(state, action);

    expect(next.board).toHaveLength(state.board.length);
    expect(next.board[0]).toEqual({
      stock: sampleMarket.stocks.find((stock) => stock.ticker === "VYT"),
      price: sampleMarket.prices.VYT[state.year],
      pickable: true,
      reason: null,
    });
    expect(next.board.slice(1).map((entry) => entry.stock)).toEqual(state.board.slice(1).map((entry) => entry.stock));
    expect(next.board.slice(1).every((entry) => !entry.pickable)).toBe(true);
    expect(reducer(state, action)).toEqual(next);
    expect(state).toEqual(before);
  });
});
