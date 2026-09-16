import type {
  BoardEntry,
  GameAction,
  GameConfig,
  GameState,
  Holding,
  Market,
  SellCheck,
  SpendOptions,
} from "@/lib/types";

/* eslint-disable @typescript-eslint/no-unused-vars */

// Starts a new game state from a config, market, and seed. Start year is chosen from the seed between market.startYear and market.endYear - rounds + 1, so every round has price data.
export function startGame(_config: GameConfig, _market: Market, _seed: number): GameState {
  throw new Error("not implemented");
}

// Creates a reducer that closes over the market so it can plug directly into React's useReducer.
export function createGameReducer(_market: Market): (state: GameState, action: GameAction) => GameState {
  return (_state: GameState, _action: GameAction): GameState => {
    throw new Error("not implemented");
  };
}

// Called once at the start of each round. The board's stocks are stored in GameState.board and do not change when the player sells. Selling only recomputes pickable and reason on existing entries. The only exception is same-industry selling: if no pickable stock from the replacement industry is on the board, one is swapped in (never an owned stock or a stock in soldThisRound). On a same-industry board, the board is redrawn from the replacement industry.
export function drawBoard(_state: GameState, _market: Market): BoardEntry[] {
  throw new Error("not implemented");
}

// Returns the spend controls available for the current state.
export function getSpendOptions(_state: GameState): SpendOptions {
  throw new Error("not implemented");
}

// Calculates the value of a holding at a given year in the market.
export function getHoldingValue(_holding: Holding, _market: Market, _year: number): number {
  throw new Error("not implemented");
}

// Determines whether a holding can be sold under the current rules.
export function canSell(_state: GameState, _holding: Holding): SellCheck {
  throw new Error("not implemented");
}

// Config checks and plain-English rule descriptions live in config.ts.
export { validateConfig, describeConfig } from "@/lib/engine/config";