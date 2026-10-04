// Runs the Mode Lab on several seeds in a row and prints how much each bot's numbers move between them.
// Usage: npm run lab:seeds -- --seeds=10 --games=1000 --seed=2024
import { fakeMarket } from "@/lib/data/market";
import { PRESET_MODES } from "@/lib/data/modes";
import { labSeedsFrom, runSeedCheck } from "@/lib/lab/seed-check";
import { STRATEGIES } from "@/lib/lab/strategies";
import { printTable, readNumberFlag } from "./cli";

const dollars = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

const seedCount = readNumberFlag("seeds", 10);
const games = readNumberFlag("games", 1000);
const firstSeed = readNumberFlag("seed", 2024);
const seeds = labSeedsFrom(firstSeed, seedCount);
const started = performance.now();
const rows = runSeedCheck({
  modes: PRESET_MODES.map((mode) => ({ name: mode.name, config: mode.config })),
  strategies: STRATEGIES,
  market: fakeMarket,
  games,
  seeds,
});

const headers = ["Bot", "Median final value, lowest / highest", "Median moved", "Idle cash, lowest / highest"];
for (const mode of PRESET_MODES) {
  console.log(`\n${mode.name} (${seedCount} seeds, ${games.toLocaleString("en-US")} games per bot per seed)`);
  const modeRows = rows.filter((row) => row.mode === mode.name);
  printTable(headers, modeRows.map((row) => [
    row.strategy,
    `${dollars(row.lowestMedian)} / ${dollars(row.highestMedian)}`,
    dollars(row.highestMedian - row.lowestMedian),
    `${dollars(row.lowestIdleCash)} / ${dollars(row.highestIdleCash)}`,
  ]));
}

const totalGames = seedCount * rows.length * games;
const seconds = (performance.now() - started) / 1000;
console.log(`\n${totalGames.toLocaleString("en-US")} games in ${seconds.toFixed(1)}s, seeds ${seeds[0]} to ${seeds[seeds.length - 1]}.`);
console.log("Each seed's full table can be reproduced with npm run lab -- --seed=<seed>.");
