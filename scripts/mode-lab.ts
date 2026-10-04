// Plays every preset mode with every bot and prints what the rules did to them.
// Usage: npm run lab -- --games=1000 --seed=2024
import { fakeMarket } from "@/lib/data/market";
import { PRESET_MODES } from "@/lib/data/modes";
import { LAB_COLUMNS, LAB_NOTE } from "@/lib/lab/columns";
import { runLab } from "@/lib/lab/run";
import { STRATEGIES } from "@/lib/lab/strategies";
import { printTable, readNumberFlag } from "./cli";

const games = readNumberFlag("games", 1000);
const seed = readNumberFlag("seed", 2024);
const started = performance.now();
const rows = runLab({
  modes: PRESET_MODES.map((mode) => ({ name: mode.name, config: mode.config })),
  strategies: STRATEGIES,
  market: fakeMarket,
  games,
  seed,
});

for (const mode of PRESET_MODES) {
  console.log(`\n${mode.name} (${games.toLocaleString("en-US")} games per bot)`);
  const modeRows = rows.filter((row) => row.mode === mode.name);
  printTable(LAB_COLUMNS.map((column) => column.header), modeRows.map((row) => LAB_COLUMNS.map((column) => column.cell(row))));
}

const totalGames = rows.length * games;
const seconds = (performance.now() - started) / 1000;
console.log(`\n${totalGames.toLocaleString("en-US")} games in ${seconds.toFixed(1)}s, seed ${seed}.`);
console.log(LAB_NOTE);
