import { describe, expect, it } from "vitest";
import { startGame } from "@/lib/engine";
import { gameSeedsForMode, hasLegalAction, playGame, runComparison, runLab } from "@/lib/lab/run";
import { bigSpender, pennyPincher, randomPlayer, STRATEGIES, type Strategy } from "@/lib/lab/strategies";
import {
  createTestMarket,
  sampleConfigActive,
  sampleConfigBudgetBoss,
  sampleConfigClassic,
  sampleConfigFocus,
  sampleConfigOneShot,
  sampleConfigSwap,
} from "@/lib/fixtures";

const market = createTestMarket({ perIndustry: 10, startYear: 2000, endYear: 2024 });
const modes = [
  { name: "Classic", config: sampleConfigClassic },
  { name: "One Shot", config: sampleConfigOneShot },
  { name: "Budget Boss", config: sampleConfigBudgetBoss },
  { name: "Active", config: sampleConfigActive },
  { name: "Swap", config: sampleConfigSwap },
  { name: "Focus", config: sampleConfigFocus },
];

describe("runLab", () => {
  it("gives the same report for the same seed and a different one for another seed", () => {
    const run = (seed: number) => runLab({ modes, strategies: STRATEGIES, market, games: 20, seed });

    expect(run(7)).toEqual(run(7));
    expect(run(7)).not.toEqual(run(8));
  });

  it("finishes every game in every mode with every bot and never gets stuck", () => {
    const rows = runLab({ modes, strategies: STRATEGIES, market, games: 50, seed: 11 });

    expect(rows).toHaveLength(modes.length * STRATEGIES.length);
    for (const row of rows) {
      expect(row.stuckGames, `${row.mode}, ${row.strategy}`).toBe(0);
      expect(row.avgBuys + row.avgSkips, `${row.mode}, ${row.strategy}`).toBe(modes.find((mode) => mode.name === row.mode)!.config.rounds);
    }
  });
});

describe("playGame", () => {
  it("has the big spender buy every Classic round and invest all its cash", () => {
    const record = playGame(sampleConfigClassic, market, bigSpender, 42);

    expect(record.buys).toBe(8);
    expect(record.skips).toBe(0);
    expect(record.idleCash).toBe(0);
  });

  it("has the penny pincher spend exactly the $500 minimum each Budget Boss round", () => {
    const record = playGame(sampleConfigBudgetBoss, market, pennyPincher, 42);

    expect(record.buys).toBe(6);
    expect(record.idleCash).toBe(10000 - 6 * 500);
  });

  it("counts an auto-sell from the final round once, not again when the game ends", () => {
    // Focus: 8 rounds, 5-year hold. Buys from rounds 1-3 sell as rounds 6-8 start; round 4 onward never sells.
    const record = playGame(sampleConfigFocus, market, bigSpender, 42);

    expect(record.buys).toBe(8);
    expect(record.autoSells).toBe(3);
  });

  it("records sales and auto-sells when the rules allow them", () => {
    const records = [1, 2, 3, 4, 5].map((seed) => playGame(sampleConfigActive, market, randomPlayer, seed));

    expect(records.some((record) => record.sales > 0)).toBe(true);
    expect(records.some((record) => record.autoSells > 0)).toBe(true);
  });

  it("throws when a bot tries a move the rules reject, so a bot bug can't hide in the averages", () => {
    const cheater: Strategy = {
      name: "Cheater",
      description: "Buys a stock that isn't on the board.",
      chooseAction: () => ({ type: "BUY", ticker: "NOT-REAL", amount: 1 }),
    };

    expect(() => playGame(sampleConfigClassic, market, cheater, 1)).toThrow("Cheater tried an illegal BUY in round 1");
  });
});

describe("hasLegalAction", () => {
  it("is false when a replacement is owed but nothing on the board can be bought", () => {
    const state = startGame(sampleConfigSwap, market, 3);
    const blocked = { ...state, board: [], mustReplaceIndustry: state.board[0].stock.industry };

    expect(hasLegalAction(state, market)).toBe(true);
    expect(hasLegalAction(blocked, market)).toBe(false);
  });
});

describe("runComparison", () => {
  const swap = { name: "Swap", config: sampleConfigSwap };
  const swapNoSelling = { name: "Swap, no selling", config: { ...sampleConfigSwap, selling: "none" as const } };

  it("gives the preset the same rows a normal lab run gives it", () => {
    const labRows = runLab({ modes, strategies: STRATEGIES, market, games: 30, seed: 9 }).filter((row) => row.mode === "Swap");
    const { base } = runComparison({ base: swap, variant: swapNoSelling, baseModeIndex: 4, strategies: STRATEGIES, market, games: 30, seed: 9 });

    expect(base).toEqual(labRows);
  });

  it("plays the variant on the same starting boards as the preset", () => {
    const firstBoards: Record<string, string[][]> = { Swap: [], "Swap, no selling": [] };
    const recordFirstBoard: Strategy = {
      ...bigSpender,
      chooseAction(state, gameMarket, rng) {
        if (state.round === 1) {
          firstBoards[state.config.selling === "none" ? "Swap, no selling" : "Swap"].push(state.board.map((entry) => entry.stock.ticker));
        }
        return bigSpender.chooseAction(state, gameMarket, rng);
      },
    };

    runComparison({ base: swap, variant: swapNoSelling, baseModeIndex: 4, strategies: [recordFirstBoard], market, games: 30, seed: 9 });

    expect(firstBoards.Swap).toHaveLength(30);
    expect(firstBoards["Swap, no selling"]).toEqual(firstBoards.Swap);
  });

  it("would give a mode added to the end of the list different games", () => {
    expect(gameSeedsForMode(9, modes.length, 30)).not.toEqual(gameSeedsForMode(9, 4, 30));
  });
});
