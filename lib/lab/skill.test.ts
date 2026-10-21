import { describe, expect, it } from "vitest";
import type { LabRow } from "@/lib/lab/run";
import { roomForSkill } from "@/lib/lab/skill";
import type { Strategy } from "@/lib/lab/strategies";

const bot = (name: string, readsFuture?: boolean, readsPastPrices?: boolean): Strategy => ({
  name,
  description: "",
  readsFuture,
  readsPastPrices,
  chooseAction: () => ({ type: "SKIP" }),
});
const honestA = bot("Honest A");
const honestB = bot("Honest B");
const reader = bot("Reader", true);
const past = bot("Past", false, true);
const strategies = [honestA, honestB, past, reader];

const row = (mode: string, strategy: string, median: number): LabRow => ({
  mode, strategy, games: 10, avgBuys: 0, avgSkips: 0, avgSales: 0, avgAutoSells: 0, avgRoundsWithNoBuy: 0,
  blockedCardShare: 0, avgIdleCash: 0, finalValueLow: 0, finalValueMedian: median, finalValueHigh: 0, stuckGames: 0, movesKey: "",
});

describe("roomForSkill", () => {
  it("picks the highest simple median and never the future reader's", () => {
    const rows = [row("M", "Past", 12500.6), row("M", "Honest A", 10000), row("M", "Honest B", 11000), row("M", "Reader", 15000)];

    expect(roomForSkill(rows, strategies)).toEqual([
      { mode: "M", bestBots: ["Honest B"], bestSimple: 11000, noteTaker: 12501, ceiling: 15000, gap: 4000, reachable: 1501 },
    ]);
  });

  it("lists every simple bot tied on the rounded median, in strategies order", () => {
    const rows = [row("M", "Past", 12500.6), row("M", "Honest B", 10000.4), row("M", "Honest A", 9999.6), row("M", "Reader", 12000)];

    expect(roomForSkill(rows, strategies)[0].bestBots).toEqual(["Honest A", "Honest B"]);
  });

  it("computes the gap from rounded medians so the printed numbers subtract exactly", () => {
    const rows = [row("M", "Past", 12500.6), row("M", "Honest A", 10880.6), row("M", "Honest B", 100), row("M", "Reader", 13610.4)];
    const [result] = roomForSkill(rows, strategies);

    expect(result.bestSimple).toBe(10881);
    expect(result.ceiling).toBe(13610);
    expect(result.gap).toBe(2729);
    expect(result.noteTaker).toBe(12501);
    expect(result.reachable).toBe(1620);
  });

  it("sorts modes by gap, largest first, keeping row order on a tie", () => {
    const rows = [
      row("Small", "Past", 11000), row("Small", "Honest A", 10000), row("Small", "Reader", 10500),
      row("TieFirst", "Past", 11000), row("TieFirst", "Honest A", 10000), row("TieFirst", "Reader", 12000),
      row("Big", "Past", 11000), row("Big", "Honest A", 10000), row("Big", "Reader", 19000),
      row("TieSecond", "Past", 11000), row("TieSecond", "Honest A", 10000), row("TieSecond", "Reader", 12000),
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
    const rows = [row("M", "Past", 12500.6), row("Missing", "Honest A", 10000), row("M", "Honest A", 10000), row("M", "Reader", 11000)];

    expect(roomForSkill(rows, strategies).map((result) => result.mode)).toEqual(["M"]);
  });

  it("keeps a negative gap negative", () => {
    const rows = [row("M", "Past", 12500.6), row("M", "Honest A", 12000), row("M", "Reader", 11500)];

    expect(roomForSkill(rows, strategies)[0].gap).toBe(-500);
  });
});

describe("skill readers", () => {
  it("requires all three kinds of bot and accepts empty inputs", () => {
    const rows = [row("M", "Honest A", 100), row("M", "Past", 200), row("M", "Reader", 300)];
    for (const bots of [[], [honestA, reader], [honestA, past], [past, reader]]) {
      expect(roomForSkill(rows, bots)).toEqual([]);
    }
    expect(roomForSkill([], strategies)).toEqual([]);
  });

  it("leaves out modes missing a required row", () => {
    const rows = [
      row("No past", "Honest A", 100), row("No past", "Reader", 300),
      row("No future", "Honest A", 100), row("No future", "Past", 200),
      row("No simple", "Past", 200), row("No simple", "Reader", 300),
      row("Unknown", "Other", 100), row("Unknown", "Past", 200), row("Unknown", "Reader", 300),
    ];
    expect(roomForSkill(rows, strategies)).toEqual([]);
  });

  it("uses the first readers and excludes every reader from simple bots", () => {
    const past2 = bot("Past 2", false, true);
    const future2 = bot("Future 2", true);
    const rows = [
      row("M", "Honest A", 100), row("M", "Past", 200), row("M", "Reader", 300),
      row("M", "Past 2", 900), row("M", "Future 2", 1000), row("M", "Unknown", 2000),
    ];
    expect(roomForSkill(rows, [honestA, past, past2, reader, future2])).toEqual([
      { mode: "M", bestBots: ["Honest A"], bestSimple: 100, noteTaker: 200, ceiling: 300, gap: 200, reachable: 100 },
    ]);
  });

  it("keeps negative reachable skill and gap", () => {
    const rows = [row("M", "Honest A", 12000), row("M", "Past", 11000), row("M", "Reader", 11500)];
    expect(roomForSkill(rows, strategies)).toEqual([
      { mode: "M", bestBots: ["Honest A"], bestSimple: 12000, noteTaker: 11000, ceiling: 11500, gap: -500, reachable: -1000 },
    ]);
  });
});
