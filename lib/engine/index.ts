import type {
  GameAction,
  GameConfig,
  GameState,
  Holding,
  Market,
  SellCheck,
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

// Board drawing lives in board.ts.
export { drawBoard } from "@/lib/engine/board";

// Spend options live in spend.ts.
export { getSpendOptions } from "@/lib/engine/spend";

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