import { canSell, getSpendOptions } from "@/lib/engine";
import type { createRng } from "@/lib/random";
import type { GameAction, GameState, Market, SpendOptions } from "@/lib/types";

export type Rng = ReturnType<typeof createRng>;

// A bot sees what a player sees and returns one action. The runner calls it until the game ends.
export type Strategy = {
  name: string;
  description: string;
  chooseAction(state: GameState, market: Market, rng: Rng): GameAction;
};

function smallestAmount(options: SpendOptions): number {
  if (options.fixedAmount !== null) {
    return options.fixedAmount;
  }

  if (options.kind === "steps") {
    return Math.min(...options.steps.filter((step) => step.enabled).map((step) => step.amount));
  }

  return options.min;
}

function largestAmount(options: SpendOptions): number {
  return options.fixedAmount ?? options.max;
}

function randomAmount(options: SpendOptions, rng: Rng): number {
  if (options.fixedAmount !== null) {
    return options.fixedAmount;
  }

  if (options.kind === "steps") {
    return rng.pick(options.steps.filter((step) => step.enabled)).amount;
  }

  return rng.int(Math.round(options.min * 100), Math.round(options.max * 100)) / 100;
}

// Buys a random pickable stock when the rules allow it, otherwise skips.
function buyOrSkip(state: GameState, rng: Rng, chooseAmount: (options: SpendOptions) => number): GameAction {
  const options = getSpendOptions(state);
  const pickable = state.board.filter((entry) => entry.pickable);

  if (!options.canBuy || pickable.length === 0) {
    return { type: "SKIP" };
  }

  const stock = rng.pick(pickable).stock;
  return { type: "BUY", ticker: stock.ticker, amount: chooseAmount(options) };
}

export const randomPlayer: Strategy = {
  name: "Random",
  description: "Sells now and then, skips 1 round in 5, and spends a random allowed amount.",
  chooseAction(state, market, rng) {
    const sellable = state.holdings.filter((holding) => canSell(state, holding, market).allowed);

    if (sellable.length > 0 && rng.next() < 0.25) {
      return { type: "SELL", holdingId: rng.pick(sellable).id };
    }

    if (state.mustReplaceIndustry === null && rng.next() < 0.2) {
      return { type: "SKIP" };
    }

    return buyOrSkip(state, rng, (options) => randomAmount(options, rng));
  },
};

export const bigSpender: Strategy = {
  name: "Big spender",
  description: "Buys every round it can, always at the largest allowed amount. Never sells.",
  chooseAction(state, _market, rng) {
    return buyOrSkip(state, rng, largestAmount);
  },
};

export const pennyPincher: Strategy = {
  name: "Penny pincher",
  description: "Buys every round it can, always at the smallest allowed amount. Never sells.",
  chooseAction(state, _market, rng) {
    return buyOrSkip(state, rng, smallestAmount);
  },
};

export const STRATEGIES: Strategy[] = [randomPlayer, bigSpender, pennyPincher];
