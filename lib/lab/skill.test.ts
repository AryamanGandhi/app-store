import { describe, expect, it } from "vitest";
import type { LabRow } from "@/lib/lab/run";
import { roomForSkill } from "@/lib/lab/skill";
import type { Strategy } from "@/lib/lab/strategies";

const bot = (name: string, readsFuture?: boolean): Strategy => ({
  name,
  description: "",
  readsFuture,
  chooseAction: () => ({ type: "SKIP" }),
});
const honestA = bot("Honest A");
const honestB = bot("Honest B");
const reader = bot("Reader", true);
const strategies = [honestA, honestB, reader];

const row = (mode: string, strategy: string, median: number): LabRow => ({
  mode, strategy, games: 10, avgBuys: 0, avgSkips: 0, avgSales: 0, avgAutoSells: 0, avgRoundsWithNoBuy: 0,
  blockedCardShare: 0, avgIdleCash: 0, finalValueLow: 0, finalValueMedian: median, finalValueHigh: 0, stuckGames: 0,
});

describe("roomForSkill", () => {
  it("picks the highest honest median and never the future reader's", () => {
    const rows = [row("M", "Honest A", 10000), row("M", "Honest B", 11000), row("M", "Reader", 15000)];

    expect(roomForSkill(rows, strategies)).toEqual([
      { mode: "M", bestBots: ["Honest B"], bestHonest: 11000, ceiling: 15000, gap: 4000 },
    ]);
  });

  it("lists every honest bot tied on the rounded median, in strategies order", () => {
    const rows = [row("M", "Honest B", 10000.4), row("M", "Honest A", 9999.6), row("M", "Reader", 12000)];

    expect(roomForSkill(rows, strategies)[0].bestBots).toEqual(["Honest A", "Honest B"]);
  });

  it("computes the gap from rounded medians so the printed numbers subtract exactly", () => {
    const rows = [row("M", "Honest A", 10880.6), row("M", "Honest B", 100), row("M", "Reader", 13610.4)];
    const [result] = roomForSkill(rows, strategies);

    expect(result.bestHonest).toBe(10881);
    expect(result.ceiling).toBe(13610);
    expect(result.gap).toBe(2729);
  });

  it("sorts modes by gap, largest first, keeping row order on a tie", () => {
    const rows = [
      row("Small", "Honest A", 10000), row("Small", "Reader", 10500),
      row("TieFirst", "Honest A", 10000), row("TieFirst", "Reader", 12000),
      row("Big", "Honest A", 10000), row("Big", "Reader", 19000),
      row("TieSecond", "Honest A", 10000), row("TieSecond", "Reader", 12000),
    ];

    expect(roomForSkill(rows, strategies).map((result) => result.mode)).toEqual(["Big", "TieFirst", "TieSecond", "Small"]);
  });

  it("returns nothing when no strategy reads the future", () => {
    expect(roomForSkill([row("M", "Honest A", 10000)], [honestA, honestB])).toEqual([]);
  });

  it("returns nothing when every strategy reads the future", () => {
    expect(roomForSkill([row("M", "Reader", 10000)], [reader, bot("Reader 2", true)])).toEqual([]);
  });

  it("leaves out a mode with no row for the future reader", () => {
    const rows = [row("Missing", "Honest A", 10000), row("M", "Honest A", 10000), row("M", "Reader", 11000)];

    expect(roomForSkill(rows, strategies).map((result) => result.mode)).toEqual(["M"]);
  });

  it("keeps a negative gap negative", () => {
    const rows = [row("M", "Honest A", 12000), row("M", "Reader", 11500)];

    expect(roomForSkill(rows, strategies)[0].gap).toBe(-500);
  });
});
