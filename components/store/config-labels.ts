import type { GameConfig } from "@/lib/types";

const formatDollars = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const joinWithOr = (values: string[]) => {
  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} or ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, or ${values[values.length - 1]}`;
};

export function roundsLabel(config: GameConfig): string {
  return `${config.rounds} rounds`;
}

export function stocksShownLabel(config: GameConfig): string {
  return `${config.stocksPerRound} ${config.stocksPerRound === 1 ? "stock" : "stocks"}`;
}

export function boardLabel(config: GameConfig): string {
  switch (config.boardDistribution) {
    case "onePerIndustry":
      return "One stock per industry";
    case "any":
      return "Any industries";
    case "sameIndustry":
      return "All from one industry";
  }
}

export function holdLabel(config: GameConfig): string {
  return config.holdYears === "indefinite" ? "Until the game ends" : `${config.holdYears} years`;
}

export function picksLabel(config: GameConfig): string {
  switch (config.pickDistribution) {
    case "onePerIndustry":
      return "One stock per industry";
    case "any":
      return "No limit";
  }
}

export function moneyLabel(config: GameConfig): string {
  switch (config.allocation.kind) {
    case "equal":
      return "Split evenly across your remaining picks";
    case "range":
      return `${formatDollars(config.allocation.min)} to ${formatDollars(config.allocation.max)} per pick`;
    case "steps":
      return `${joinWithOr(config.allocation.percents.map((percent) => `${percent}%`))} of your budget`;
    case "minPlusFree":
      return `At least ${formatDollars(config.allocation.min)}, then as much as you want`;
  }
}

export function sellingLabel(config: GameConfig): string {
  switch (config.selling) {
    case "none":
      return "Not allowed";
    case "any":
      return "Sell any stock, anytime";
    case "sameIndustry":
      return "Sell, then replace from the same industry";
  }
}

export function configRows(config: GameConfig): { label: string; value: string }[] {
  return [
    { label: "Rounds", value: roundsLabel(config) },
    { label: "Stocks shown", value: stocksShownLabel(config) },
    { label: "Board", value: boardLabel(config) },
    { label: "Picks", value: picksLabel(config) },
    { label: "Money", value: moneyLabel(config) },
    { label: "Hold time", value: holdLabel(config) },
    { label: "Selling", value: sellingLabel(config) },
  ];
}