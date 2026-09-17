import { drawBoard, recomputePickability } from "@/lib/engine/board";
import { canSell } from "@/lib/engine/sell";
import { getSpendOptions, isAmountAllowed } from "@/lib/engine/spend";
import { createRng, deriveSeed } from "@/lib/random";
import type { GameAction, GameConfig, GameState, Holding, Market } from "@/lib/types";

const roundToCents = (value: number) => Math.round(value * 100) / 100;

export function startGame(config: GameConfig, market: Market, seed: number): GameState {
  const lastStartYear = market.endYear - config.rounds + 1;

  if (lastStartYear < market.startYear) {
    throw new Error(`Market has ${market.endYear - market.startYear + 1} years, but the game needs ${config.rounds} rounds.`);
  }

  const startYear = createRng(seed).int(market.startYear, lastStartYear);
  const state: GameState = {
    config,
    seed,
    startYear,
    round: 1,
    year: startYear,
    cash: config.startingBudget,
    holdings: [],
    board: [],
    soldThisRound: [],
    mustReplaceIndustry: null,
    events: [],
    status: "playing",
  };

  return { ...state, board: drawBoard(state, market) };
}

export function getHoldingValue(holding: Holding, market: Market, year: number): number {
  return roundToCents(holding.shares * market.prices[holding.ticker][year]);
}

function endRound(state: GameState, market: Market): GameState {
  if (state.round === state.config.rounds) {
    return { ...state, status: "done", board: [], soldThisRound: [] };
  }

  const nextState: GameState = {
    ...state,
    round: state.round + 1,
    year: state.year + 1,
    holdings: [],
    events: [],
    soldThisRound: [],
  };

  for (const holding of state.holdings) {
    const holdYears = state.config.holdYears;

    if (holdYears !== "indefinite" && nextState.year >= holding.yearBought + holdYears) {
      const value = getHoldingValue(holding, market, nextState.year);
      const dollars = Math.round(value).toLocaleString("en-US");
      nextState.cash = roundToCents(nextState.cash + value);
      nextState.events.push({
        id: `autoSell-${holding.id}-${nextState.year}`,
        kind: "autoSell",
        message: `${holding.name}'s hold ended, sold for $${dollars}.`,
      });
    } else {
      nextState.holdings.push(holding);
    }
  }

  return { ...nextState, board: drawBoard(nextState, market) };
}

export function createGameReducer(market: Market): (state: GameState, action: GameAction) => GameState {
  return (state, action) => {
    if (action.type === "RESTART") {
      return startGame(state.config, market, action.seed);
    }

    if (state.status !== "playing") {
      return state;
    }

    if (action.type === "SELL") {
      const holding = state.holdings.find((candidate) => candidate.id === action.holdingId);

      if (!holding || !canSell(state, holding, market).allowed) {
        return state;
      }

      const value = getHoldingValue(holding, market, state.year);
      const dollars = Math.round(value).toLocaleString("en-US");
      const nextState: GameState = {
        ...state,
        cash: roundToCents(state.cash + value),
        holdings: state.holdings.filter((candidate) => candidate.id !== holding.id),
        soldThisRound: [...state.soldThisRound, holding.ticker],
        mustReplaceIndustry: state.config.selling === "sameIndustry" ? holding.industry : null,
        events: [...state.events, {
          id: `sell-${holding.id}-${state.year}`,
          kind: "sell",
          message: `Sold ${holding.name} for $${dollars}.`,
        }],
      };

      if (nextState.mustReplaceIndustry !== null && state.config.boardDistribution === "sameIndustry") {
        const drawState = { ...nextState, seed: deriveSeed(state.seed, 2501) };
        return { ...nextState, board: drawBoard(drawState, market) };
      }

      nextState.board = recomputePickability(nextState, state.board);
      const replacementIndustry = nextState.mustReplaceIndustry;
      if (replacementIndustry !== null && !nextState.board.some((entry) => entry.pickable && entry.stock.industry === replacementIndustry)) {
        const candidates = market.stocks.filter((stock) =>
          stock.industry === replacementIndustry &&
          !nextState.holdings.some((owned) => owned.ticker === stock.ticker) &&
          !nextState.soldThisRound.includes(stock.ticker),
        );

        if (candidates.length > 0) {
          const rng = createRng(deriveSeed(deriveSeed(state.seed, state.round), 2502));
          const stock = rng.pick(candidates);
          const blockedIndex = nextState.board.findIndex((entry) => !entry.pickable);
          const replaceIndex = blockedIndex >= 0 ? blockedIndex : Math.max(0, nextState.board.length - 1);
          nextState.board[replaceIndex] = {
            stock,
            price: market.prices[stock.ticker][state.year],
            pickable: true,
            reason: null,
          };
        }
      }

      return nextState;
    }

    if (action.type === "BUY") {
      const entry = state.board.find((candidate) => candidate.stock.ticker === action.ticker);

      if (!entry?.pickable || !isAmountAllowed(getSpendOptions(state), action.amount)) {
        return state;
      }

      const amount = roundToCents(action.amount);
      const holding: Holding = {
        ...entry.stock,
        id: `${entry.stock.ticker}-${state.year}`,
        yearBought: state.year,
        amountSpent: amount,
        shares: amount / market.prices[entry.stock.ticker][state.year],
      };

      return endRound({
        ...state,
        cash: roundToCents(state.cash - amount),
        holdings: [...state.holdings, holding],
        mustReplaceIndustry: null,
      }, market);
    }

    if (action.type === "SKIP" && state.mustReplaceIndustry === null) {
      return endRound(state, market);
    }

    return state;
  };
}
