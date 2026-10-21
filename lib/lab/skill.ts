import type { LabRow } from "@/lib/lab/run";
import type { Strategy } from "@/lib/lab/strategies";

export type SkillRow = {
  mode: string;
  bestBots: string[];
  bestSimple: number;
  noteTaker: number;
  ceiling: number;
  gap: number;
  reachable: number;
};

// Per mode: how far the best simple bot's median falls short of a bot that reads future prices,
// and how much of that the bot reading only shown prices makes up.
export function roomForSkill(rows: LabRow[], strategies: Strategy[]): SkillRow[] {
  const futureReader = strategies.find((strategy) => strategy.readsFuture === true);
  const pastReader = strategies.find((strategy) => strategy.readsPastPrices === true);
  const simpleBots = strategies.filter((strategy) => strategy.readsFuture !== true && strategy.readsPastPrices !== true);
  if (!futureReader || !pastReader || simpleBots.length === 0) {
    return [];
  }

  const modes = [...new Set(rows.map((row) => row.mode))];
  const result: SkillRow[] = [];

  for (const mode of modes) {
    const medianOf = (strategy: Strategy) => {
      const row = rows.find((candidate) => candidate.mode === mode && candidate.strategy === strategy.name);
      return row ? Math.round(row.finalValueMedian) : null;
    };
    const ceiling = medianOf(futureReader);
    const noteTaker = medianOf(pastReader);
    const simpleMedians = simpleBots
      .map((strategy) => ({ name: strategy.name, median: medianOf(strategy) }))
      .filter((entry): entry is { name: string; median: number } => entry.median !== null);

    if (ceiling === null || noteTaker === null || simpleMedians.length === 0) {
      continue;
    }

    const bestSimple = Math.max(...simpleMedians.map((entry) => entry.median));
    const bestBots = simpleMedians.filter((entry) => entry.median === bestSimple).map((entry) => entry.name);
    result.push({
      mode,
      bestBots,
      bestSimple,
      noteTaker,
      ceiling,
      gap: ceiling - bestSimple,
      reachable: noteTaker - bestSimple,
    });
  }

  // Array sort is stable, so modes with the same gap keep their order from rows.
  return result.sort((a, b) => b.gap - a.gap);
}
