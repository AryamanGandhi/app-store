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

const percent = (value: number) => `${Math.round(value)}%`;
const toTenths = (value: number) => Math.round(value * 10) / 10;

// Numeric columns for comparing a preset with a variant. Values are rounded as shown, so a change matches the cells above it.
export const LAB_COMPARE_COLUMNS: { header: string; value: (row: LabRow) => number; format: (value: number) => string }[] = [
  { header: "Buys", value: (row) => toTenths(row.avgBuys), format: oneDecimal },
  { header: "Skips", value: (row) => toTenths(row.avgSkips), format: oneDecimal },
  { header: "Blocked cards", value: (row) => Math.round(row.blockedCardShare * 100), format: percent },
  { header: "Sales", value: (row) => toTenths(row.avgSales), format: oneDecimal },
  { header: "Auto-sells", value: (row) => toTenths(row.avgAutoSells), format: oneDecimal },
  { header: "Idle cash", value: (row) => Math.round(row.avgIdleCash), format: dollars },
  { header: "Median final value", value: (row) => Math.round(row.finalValueMedian), format: dollars },
  { header: "Stuck", value: (row) => row.stuckGames, format: String },
];

// A change is the variant minus the preset, with a sign unless it rounds to zero.
export function formatChange(format: (value: number) => string, change: number): string {
  const size = format(Math.abs(change));
  if (size === format(0)) {
    return size;
  }

  return `${change > 0 ? "+" : "-"}${size}`;
}
