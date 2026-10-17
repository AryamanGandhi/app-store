import { describe, expect, it } from "vitest";
import { fakeMarket } from "@/lib/data/market";
import { PRESET_MODES } from "@/lib/data/modes";
import { runLab, type LabRow } from "@/lib/lab/run";
import { sameMoveGroups } from "@/lib/lab/same-moves";
import { STRATEGIES } from "@/lib/lab/strategies";

const row = (mode: string, strategy: string, movesKey: string, games = 2): LabRow => ({
  mode, strategy, games, avgBuys: 0, avgSkips: 0, avgSales: 0, avgAutoSells: 0, avgRoundsWithNoBuy: 0,
  blockedCardShare: 0, avgIdleCash: 0, finalValueLow: 0, finalValueMedian: 0, finalValueHigh: 0, stuckGames: 0, movesKey,
});

describe("sameMoveGroups", () => {
  it("groups two bots in one mode with the same moves", () => {
    expect(sameMoveGroups([row("M", "A", "K,K\nK,K"), row("M", "B", "K,K\nK,K")])).toEqual([{ mode: "M", bots: ["A", "B"] }]);
  });

  it("doesn't group bots that differ by one move in one game", () => {
    expect(sameMoveGroups([row("M", "A", "K,K\nK,K"), row("M", "B", "K,K\nK,B:QNT:100")])).toEqual([]);
  });

  it("returns two separate groups in one mode, each in row order", () => {
    const rows = [row("M", "A", "x"), row("M", "B", "y"), row("M", "C", "x"), row("M", "D", "y"), row("M", "E", "z")];

    expect(sameMoveGroups(rows)).toEqual([{ mode: "M", bots: ["A", "C"] }, { mode: "M", bots: ["B", "D"] }]);
  });

  it("never groups across modes", () => {
    expect(sameMoveGroups([row("M1", "A", "x"), row("M2", "B", "x")])).toEqual([]);
  });

  it("never groups rows from runs with different game counts", () => {
    expect(sameMoveGroups([row("M", "A", "x", 2), row("M", "B", "x", 3)])).toEqual([]);
  });

  it("returns nothing for a mode with no matches", () => {
    expect(sameMoveGroups([row("M", "A", "x"), row("M", "B", "y")])).toEqual([]);
  });

  it("finds the expected matches in the real presets", () => {
    const rows = runLab({
      modes: PRESET_MODES.map((mode) => ({ name: mode.name, config: mode.config })),
      strategies: STRATEGIES,
      market: fakeMarket,
      games: 50,
      seed: 2024,
    });
    const groups = sameMoveGroups(rows);
    const botsIn = (mode: string) => groups.filter((group) => group.mode === mode).map((group) => group.bots);

    expect(botsIn("Classic Draft")).toEqual([["Big spender", "Penny pincher", "Churner"]]);
    expect(botsIn("Budget Boss")).toEqual([["Big spender", "Churner"]]);
    expect(botsIn("Active Trader")).toEqual([]);
  });
});
