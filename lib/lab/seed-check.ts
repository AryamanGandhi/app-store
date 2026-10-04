import { runLab, type LabMode, type LabRow } from "@/lib/lab/run";
import type { Strategy } from "@/lib/lab/strategies";
import type { Market } from "@/lib/types";

export type SeedCheckRow = {
  mode: string;
  strategy: string;
  lowestMedian: number;
  highestMedian: number;
  lowestIdleCash: number;
  highestIdleCash: number;
};

// Lab seeds are consecutive, so any one run can be reproduced with `npm run lab -- --seed=<n>`.
export function labSeedsFrom(firstSeed: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => firstSeed + index);
}

// Runs the whole lab once per seed and reports how far each row's numbers move between seeds.
export function runSeedCheck(options: { modes: LabMode[]; strategies: Strategy[]; market: Market; games: number; seeds: number[] }): SeedCheckRow[] {
  if (options.seeds.length === 0) {
    throw new Error("The seed check needs at least one seed.");
  }

  const runs: LabRow[][] = options.seeds.map((seed) =>
    runLab({ modes: options.modes, strategies: options.strategies, market: options.market, games: options.games, seed }),
  );

  // Every run lists the same mode and bot pairs in the same order, so row i always means the same pair.
  return runs[0].map((firstRow, index) => {
    const medians = runs.map((rows) => rows[index].finalValueMedian);
    const idleCash = runs.map((rows) => rows[index].avgIdleCash);

    return {
      mode: firstRow.mode,
      strategy: firstRow.strategy,
      lowestMedian: Math.min(...medians),
      highestMedian: Math.max(...medians),
      lowestIdleCash: Math.min(...idleCash),
      highestIdleCash: Math.max(...idleCash),
    };
  });
}
