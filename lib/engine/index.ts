import type { GameState, Holding, SellCheck } from "@/lib/types";

// Game state transitions and holding values live in game.ts.
export { startGame, createGameReducer, getHoldingValue } from "@/lib/engine/game";

// Board drawing lives in board.ts.
export { drawBoard } from "@/lib/engine/board";

// Spend options live in spend.ts.
export { getSpendOptions } from "@/lib/engine/spend";

// Determines whether a holding can be sold under the current rules.
export const canSell: (state: GameState, holding: Holding) => SellCheck = () => {
  throw new Error("not implemented");
};

// Config checks and plain-English rule descriptions live in config.ts.
export { validateConfig, describeConfig } from "@/lib/engine/config";
