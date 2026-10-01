import type { LabRow } from "@/lib/lab/run";

const dollars = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;
const oneDecimal = (value: number) => value.toFixed(1);

// Shared by the npm script and the /dev/lab page so both print the same table.
export const LAB_COLUMNS: { header: string; cell: (row: LabRow) => string }[] = [
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

export const LAB_NOTE = "Averages are per game. Idle cash is cash not in any stock when the game ends.";
