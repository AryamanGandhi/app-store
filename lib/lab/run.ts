import { canSell, createGameReducer, getHoldingValue, getSpendOptions, startGame } from "@/lib/engine";
import type { Strategy } from "@/lib/lab/strategies";
import { createRng, deriveSeed } from "@/lib/random";
import type { GameConfig, GameState, Market } from "@/lib/types";

export type GameRecord = {
  buys: number;
  skips: number;
  sales: number;
  autoSells: number;
  roundsWithNoBuy: number;
  cardsShown: number;
  cardsBlocked: number;
  idleCash: number;
  finalValue: number;
  stuck: boolean;
};

export type LabRow = {
  mode: string;
  strategy: string;
  games: number;
  avgBuys: number;
  avgSkips: number;
  avgSales: number;
  avgAutoSells: number;
  avgRoundsWithNoBuy: number;
  blockedCardShare: number;
  avgIdleCash: number;
  finalValueLow: number;
  finalValueMedian: number;
  finalValueHigh: number;
  stuckGames: number;
};

export type LabMode = { name: string; config: GameConfig };

// A game is stuck when the player has no legal way to finish the round.
export function hasLegalAction(state: GameState, market: Market): boolean {
  const canBuy = getSpendOptions(state).canBuy && state.board.some((entry) => entry.pickable);
  const canSkip = state.mustReplaceIndustry === null;
  const canSellAny = state.holdings.some((holding) => canSell(state, holding, market).allowed);

  return canBuy || canSkip || canSellAny;
}

export function playGame(config: GameConfig, market: Market, strategy: Strategy, seed: number): GameRecord {
  const reducer = createGameReducer(market);
  // Actions draw from their own stream so a seed replays the same game for every bot.
  const actionRng = createRng(deriveSeed(seed, 2404));
  const record: GameRecord = {
    buys: 0, skips: 0, sales: 0, autoSells: 0, roundsWithNoBuy: 0,
    cardsShown: 0, cardsBlocked: 0, idleCash: 0, finalValue: 0, stuck: false,
  };
  let state = startGame(config, market, seed);
  let roundCounted = 0;

  while (state.status === "playing") {
    if (state.round !== roundCounted) {
      roundCounted = state.round;
      record.cardsShown += state.board.length;
      record.cardsBlocked += state.board.filter((entry) => !entry.pickable).length;
      if (!getSpendOptions(state).canBuy || !state.board.some((entry) => entry.pickable)) {
        record.roundsWithNoBuy += 1;
      }
    }

    if (!hasLegalAction(state, market)) {
      record.stuck = true;
      break;
    }

    const action = strategy.chooseAction(state, market, actionRng);
    const next = reducer(state, action);

    if (next === state) {
      throw new Error(`${strategy.name} tried an illegal ${action.type} in round ${state.round} (seed ${seed}).`);
    }

    if (action.type === "SELL") {
      record.sales += 1;
    } else {
      record.buys += action.type === "BUY" ? 1 : 0;
      record.skips += action.type === "SKIP" ? 1 : 0;
      record.autoSells += next.events.filter((event) => event.kind === "autoSell").length;
    }
    state = next;
  }

  const holdingsValue = state.holdings.reduce((total, holding) => total + getHoldingValue(holding, market, state.year), 0);
  record.idleCash = state.cash;
  record.finalValue = Math.round((state.cash + holdingsValue) * 100) / 100;

  return record;
}

const average = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length;

// Nearest-rank percentile on a sorted copy; good enough for a report, not for statistics.
function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))];
}

export function summarize(mode: string, strategy: string, records: GameRecord[]): LabRow {
  const finalValues = records.map((record) => record.finalValue);
  const cardsShown = records.reduce((total, record) => total + record.cardsShown, 0);
  const cardsBlocked = records.reduce((total, record) => total + record.cardsBlocked, 0);

  return {
    mode,
    strategy,
    games: records.length,
    avgBuys: average(records.map((record) => record.buys)),
    avgSkips: average(records.map((record) => record.skips)),
    avgSales: average(records.map((record) => record.sales)),
    avgAutoSells: average(records.map((record) => record.autoSells)),
    avgRoundsWithNoBuy: average(records.map((record) => record.roundsWithNoBuy)),
    blockedCardShare: cardsShown === 0 ? 0 : cardsBlocked / cardsShown,
    avgIdleCash: average(records.map((record) => record.idleCash)),
    finalValueLow: percentile(finalValues, 0.1),
    finalValueMedian: percentile(finalValues, 0.5),
    finalValueHigh: percentile(finalValues, 0.9),
    stuckGames: records.filter((record) => record.stuck).length,
  };
}

// Every bot plays the same seeds in a mode, so differences between rows come from the bots, not luck of the draw.
export function runLab(options: { modes: LabMode[]; strategies: Strategy[]; market: Market; games: number; seed: number }): LabRow[] {
  const rows: LabRow[] = [];

  for (const [modeIndex, mode] of options.modes.entries()) {
    const seedRng = createRng(deriveSeed(options.seed, modeIndex + 1));
    const seeds = Array.from({ length: options.games }, () => seedRng.int(1, 2147483647));

    for (const strategy of options.strategies) {
      const records = seeds.map((seed) => playGame(mode.config, options.market, strategy, seed));
      rows.push(summarize(mode.name, strategy.name, records));
    }
  }

  return rows;
}
