import { describe, expect, it } from "vitest";
import { createGameReducer, getSpendOptions, startGame } from "@/lib/engine";
import { recomputePickability } from "@/lib/engine/board";
import { isAmountAllowed } from "@/lib/engine/spend";
import {
  createTestMarket,
  sampleConfigActive,
  sampleConfigBudgetBoss,
  sampleConfigClassic,
  sampleConfigFocus,
  sampleConfigOneShot,
  sampleConfigSwap,
} from "@/lib/fixtures";
import { createRng, deriveSeed } from "@/lib/random";
import type { GameAction, GameConfig, GameState, SpendOptions } from "@/lib/types";

const market = createTestMarket({ perIndustry: 10, startYear: 2000, endYear: 2024 });
const reducer = createGameReducer(market);
const configs: { name: string; config: GameConfig }[] = [
  { name: "Classic", config: sampleConfigClassic },
  { name: "One Shot", config: sampleConfigOneShot },
  { name: "Budget Boss", config: sampleConfigBudgetBoss },
  { name: "Active", config: sampleConfigActive },
  { name: "Swap", config: sampleConfigSwap },
  { name: "Focus", config: sampleConfigFocus },
  { name: "One stock for ten rounds", config: { ...sampleConfigActive, stocksPerRound: 1 } },
  { name: "Ten stocks from one industry", config: { ...sampleConfigFocus, stocksPerRound: 10 } },
];

const seedRng = createRng(240024);
const cases = configs.map((entry) => ({
  ...entry,
  seeds: Array.from({ length: 200 }, () => seedRng.int(1, 2147483647)),
}));

function randomAmount(options: SpendOptions, rng: ReturnType<typeof createRng>): number {
  if (options.fixedAmount !== null) {
    return options.fixedAmount;
  }

  if (options.kind === "steps") {
    return rng.pick(options.steps.filter((step) => step.enabled)).amount;
  }

  return rng.int(Math.round(options.min * 100), Math.round(options.max * 100)) / 100;
}

function checkState(state: GameState, actionsTaken: number, context: string) {
  expect(Number.isFinite(state.cash), context).toBe(true);
  expect(state.cash, context).toBeGreaterThanOrEqual(0);
  expect(state.cash, context).toBe(Math.round(state.cash * 100) / 100);
  expect(state.round, context).toBe(Math.min(actionsTaken + 1, state.config.rounds));
  expect(state.year, context).toBe(state.startYear + state.round - 1);
  expect(state.year, context).toBeLessThanOrEqual(market.endYear);
  expect(state.status, context).toBe(actionsTaken === state.config.rounds ? "done" : "playing");
  expect(state.board.length, context).toBeLessThanOrEqual(state.config.stocksPerRound);

  if (state.config.pickDistribution === "onePerIndustry") {
    expect(new Set(state.holdings.map((holding) => holding.industry)).size, context).toBe(state.holdings.length);
  }

  if (state.status === "done") {
    expect(state.board, context).toEqual([]);
    expect(state.soldThisRound, context).toEqual([]);
    return;
  }

  const options = getSpendOptions(state);
  const pickableOnBoard = state.board.some((entry) => entry.pickable);
  const availableStocks = market.stocks.filter((stock) =>
    !state.holdings.some((holding) => holding.ticker === stock.ticker) && !state.soldThisRound.includes(stock.ticker),
  );
  const marketBoard = availableStocks.map((stock) => ({
    stock, price: market.prices[stock.ticker][state.year], pickable: true, reason: null,
  }));
  const pickableInMarket = recomputePickability(state, marketBoard).some((entry) => entry.pickable);

  if (options.canBuy && pickableInMarket) {
    expect(pickableOnBoard, context).toBe(true);
  }

  const minimumAmount = options.fixedAmount ?? options.steps.find((step) => step.enabled)?.amount ?? options.min;
  const canBuy = pickableOnBoard && isAmountAllowed(options, minimumAmount);
  const canSkip = state.mustReplaceIndustry === null;
  expect(canBuy || canSkip, context).toBe(true);

  if (canSkip) {
    expect(reducer(state, { type: "SKIP" }), context).not.toBe(state);
  }
}

describe("full game simulations", () => {
  it.each(cases)("plays 200 complete games of $name", ({ name, config, seeds }) => {
    for (const seed of seeds) {
      // Actions have their own deterministic stream, so the config and game seed replay the whole game.
      const actionRng = createRng(deriveSeed(seed, 2404));
      let state = startGame(config, market, seed);
      const context = `${name}, seed ${seed}`;
      checkState(state, 0, `${context}, starting state`);

      for (let actionsTaken = 1; actionsTaken <= config.rounds; actionsTaken += 1) {
        const roundContext = `${context}, action ${actionsTaken}`;
        const options = getSpendOptions(state);
        const pickable = state.board.filter((entry) => entry.pickable);
        const shouldSkip = actionRng.next() < 0.2;
        let action: GameAction;

        if (options.canBuy && pickable.length > 0 && (!shouldSkip || state.mustReplaceIndustry !== null)) {
          const stock = actionRng.pick(pickable).stock;
          const amount = randomAmount(options, actionRng);
          expect(isAmountAllowed(options, amount), roundContext).toBe(true);
          action = { type: "BUY", ticker: stock.ticker, amount };
        } else {
          expect(state.mustReplaceIndustry, roundContext).toBeNull();
          action = { type: "SKIP" };
        }

        const next = reducer(state, action);
        expect(next, roundContext).not.toBe(state);
        state = next;
        checkState(state, actionsTaken, roundContext);
      }

      expect(state.status, context).toBe("done");
      expect(reducer(state, { type: "SKIP" }), context).toBe(state);
    }
  });
});
