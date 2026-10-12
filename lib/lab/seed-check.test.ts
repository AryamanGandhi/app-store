import { describe, expect, it } from "vitest";
import { createTestMarket, sampleConfigBudgetBoss, sampleConfigClassic } from "@/lib/fixtures";
import { runLab } from "@/lib/lab/run";
import { labSeedsFrom, runSeedCheck } from "@/lib/lab/seed-check";
import { STRATEGIES } from "@/lib/lab/strategies";

const market = createTestMarket({ perIndustry: 10, startYear: 2000, endYear: 2024 });
const modes = [
  { name: "Classic", config: sampleConfigClassic },
  { name: "Budget Boss", config: sampleConfigBudgetBoss },
];

describe("labSeedsFrom", () => {
  it("counts up from the first seed", () => {
    expect(labSeedsFrom(2024, 3)).toEqual([2024, 2025, 2026]);
  });
});

describe("runSeedCheck", () => {
  it("matches a single lab run exactly when given one seed", () => {
    const [labRow] = runLab({ modes, strategies: STRATEGIES, market, games: 30, seed: 5 });
    const [checkRow] = runSeedCheck({ modes, strategies: STRATEGIES, market, games: 30, seeds: [5] });

    expect(checkRow.lowestMedian).toBe(labRow.finalValueMedian);
    expect(checkRow.highestMedian).toBe(labRow.finalValueMedian);
    expect(checkRow.lowestIdleCash).toBe(labRow.avgIdleCash);
  });

  it("reports the lowest and highest median across the seeds", () => {
    const seeds = [5, 6, 7];
    const medians = seeds.map((seed) => runLab({ modes, strategies: STRATEGIES, market, games: 30, seed })[0].finalValueMedian);
    const [checkRow] = runSeedCheck({ modes, strategies: STRATEGIES, market, games: 30, seeds });

    expect(checkRow.mode).toBe("Classic");
    expect(checkRow.lowestMedian).toBe(Math.min(...medians));
    expect(checkRow.highestMedian).toBe(Math.max(...medians));
    expect(checkRow.highestMedian).toBeGreaterThan(checkRow.lowestMedian);
  });

  it("keeps the penny pincher's Budget Boss idle cash fixed on every seed", () => {
    const rows = runSeedCheck({ modes, strategies: STRATEGIES, market, games: 30, seeds: [5, 6, 7] });
    const pincher = rows.find((row) => row.mode === "Budget Boss" && row.strategy === "Penny pincher")!;

    expect(pincher.lowestIdleCash).toBe(10000 - 6 * 500);
    expect(pincher.highestIdleCash).toBe(10000 - 6 * 500);
  });

  it("refuses an empty seed list", () => {
    expect(() => runSeedCheck({ modes, strategies: STRATEGIES, market, games: 30, seeds: [] })).toThrow();
  });
});
