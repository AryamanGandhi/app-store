import type { LabRow } from "@/lib/lab/run";
import type { SkillRow } from "@/lib/lab/skill";

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

export function sameMovesLine(bots: string[], games: number): string {
  const names = bots.length < 2 ? bots.join("") : `${bots.slice(0, -1).join(", ")} and ${bots[bots.length - 1]}`;
  return `Same moves in all ${games.toLocaleString("en-US")} games: ${names}.`;
}

// Shared by the npm script and the /dev/lab page so both print the same Room for skill table.
export const SKILL_COLUMNS: { header: string; cell: (row: SkillRow) => string }[] = [
  { header: "Mode", cell: (row) => row.mode },
  { header: "Best simple bot", cell: (row) => row.bestBots.join(", ") },
  { header: "Best simple median", cell: (row) => dollars(row.bestSimple) },
  { header: "Note taker median", cell: (row) => dollars(row.noteTaker) },
  { header: "Hindsight median", cell: (row) => dollars(row.ceiling) },
  { header: "Room for skill", cell: (row) => formatChange(dollars, row.gap) },
  { header: "Reachable skill", cell: (row) => formatChange(dollars, row.reachable) },
  { header: "Share reached", cell: (row) => (row.gap > 0 ? `${Math.round((row.reachable / row.gap) * 100)}%` : "n/a") },
];

export const SKILL_NOTE = "Room for skill is Hindsight's median minus the best simple bot's median. Hindsight reads future prices, so it marks the best result a mode allows, not a real player. The Note taker only uses prices it has been shown on a board. Reachable skill is the Note taker's median minus the best simple bot's median, and Share reached is how much of the room for skill that covers. Prices come from the sandbox's fake market.";

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
