// Plays every preset mode with every bot and prints what the rules did to them.
// Usage: npm run lab -- --games=1000 --seed=2024
import { fakeMarket } from "@/lib/data/market";
import { PRESET_MODES } from "@/lib/data/modes";
import { runLab, type LabRow } from "@/lib/lab/run";
import { STRATEGIES } from "@/lib/lab/strategies";

function readNumberFlag(name: string, fallback: number): number {
  const flag = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  const value = flag ? Number(flag.split("=")[1]) : fallback;

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`--${name} must be a whole number of at least 1.`);
  }

  return value;
}

const dollars = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;
const oneDecimal = (value: number) => value.toFixed(1);

const COLUMNS: { header: string; cell: (row: LabRow) => string }[] = [
  { header: "Bot", cell: (row) => row.strategy },
  { header: "Buys", cell: (row) => oneDecimal(row.avgBuys) },
  { header: "Skips", cell: (row) => oneDecimal(row.avgSkips) },
  { header: "No-buy rounds", cell: (row) => oneDecimal(row.avgRoundsWithNoBuy) },
  { header: "Blocked cards", cell: (row) => `${Math.round(row.blockedCardShare * 100)}%` },
  { header: "Sales", cell: (row) => oneDecimal(row.avgSales) },
  { header: "Auto-sells", cell: (row) => oneDecimal(row.avgAutoSells) },
  { header: "Idle cash", cell: (row) => dollars(row.avgIdleCash) },
  { header: "Final value p10 / median / p90", cell: (row) =>
    `${dollars(row.finalValueLow)} / ${dollars(row.finalValueMedian)} / ${dollars(row.finalValueHigh)}` },
  { header: "Stuck", cell: (row) => String(row.stuckGames) },
];

function printTable(rows: LabRow[]) {
  const cells = rows.map((row) => COLUMNS.map((column) => column.cell(row)));
  const widths = COLUMNS.map((column, index) => Math.max(column.header.length, ...cells.map((line) => line[index].length)));
  const formatLine = (line: string[]) => line.map((cell, index) => cell.padEnd(widths[index])).join("  ");

  console.log(formatLine(COLUMNS.map((column) => column.header)));
  cells.forEach((line) => console.log(formatLine(line)));
}

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
  printTable(rows.filter((row) => row.mode === mode.name));
}

const totalGames = rows.length * games;
const seconds = (performance.now() - started) / 1000;
console.log(`\n${totalGames.toLocaleString("en-US")} games in ${seconds.toFixed(1)}s, seed ${seed}.`);
console.log("Averages are per game. Idle cash is cash not in any stock when the game ends.");
