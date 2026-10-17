import type { LabRow } from "@/lib/lab/run";
import type { Strategy } from "@/lib/lab/strategies";

export type SkillRow = { mode: string; bestBots: string[]; bestHonest: number; ceiling: number; gap: number };

// How far the best honest bot's median falls short of a bot that reads future prices, per mode.
export function roomForSkill(rows: LabRow[], strategies: Strategy[]): SkillRow[] {
  const futureReader = strategies.find((strategy) => strategy.readsFuture === true);
  const honestBots = strategies.filter((strategy) => strategy.readsFuture !== true);
  if (!futureReader || honestBots.length === 0) {
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
    const honestMedians = honestBots
      .map((strategy) => ({ name: strategy.name, median: medianOf(strategy) }))
      .filter((entry): entry is { name: string; median: number } => entry.median !== null);

    if (ceiling === null || honestMedians.length === 0) {
      continue;
    }

    const bestHonest = Math.max(...honestMedians.map((entry) => entry.median));
    const bestBots = honestMedians.filter((entry) => entry.median === bestHonest).map((entry) => entry.name);
    result.push({ mode, bestBots, bestHonest, ceiling, gap: ceiling - bestHonest });
  }

  // Array sort is stable, so modes with the same gap keep their order from rows.
  return result.sort((a, b) => b.gap - a.gap);
}
