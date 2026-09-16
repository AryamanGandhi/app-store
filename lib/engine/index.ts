import type {
  BoardEntry,
  ConfigCheckResult,
  GameAction,
  GameConfig,
  GameState,
  Holding,
  Market,
  SellCheck,
  SpendOptions,
} from "@/lib/types";

/* eslint-disable @typescript-eslint/no-unused-vars */

// Starts a new game state from a config, market, and seed.
export function startGame(_config: GameConfig, _market: Market, _seed: number): GameState {
  throw new Error("not implemented");
}

// Applies a user action and returns the next game state.
export function gameReducer(_state: GameState, _action: GameAction, _market: Market): GameState {
  throw new Error("not implemented");
}

// Builds the board entries that should be shown for the current round.
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

// Checks whether a config is valid and returns errors and warnings.
export function validateConfig(_config: GameConfig): ConfigCheckResult {
  throw new Error("not implemented");
}

// Produces plain-English descriptions for a game config.
export function describeConfig(_config: GameConfig): string[] {
  throw new Error("not implemented");
}