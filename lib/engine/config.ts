import {
  ALLOCATION_KIND_OPTIONS,
  BOARD_DISTRIBUTION_OPTIONS,
  HOLD_YEARS_OPTIONS,
  INDUSTRIES,
  PICK_DISTRIBUTION_OPTIONS,
  ROUND_OPTIONS,
  SELLING_OPTIONS,
  STOCKS_PER_ROUND_OPTIONS,
} from "@/lib/constants";
import type { ConfigCheckResult, ConfigIssue, GameConfig } from "@/lib/types";

const INDUSTRY_LIMIT = INDUSTRIES.length;

type AllocationFields = { kind: unknown; min: unknown; max: unknown; percents: unknown };

const roundToCents = (value: number) => Math.round(value * 100) / 100;

const floorToCents = (value: number) => Math.floor(value * 100) / 100;

const formatDollars = (value: number) =>
  `$${roundToCents(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isOneOf = <T>(options: readonly T[], value: unknown): value is T => options.includes(value as T);

const listItems = (items: string[]) =>
  items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")}, or ${items[items.length - 1]}`;

// Configs can come from a hand-edited URL, so every field is read as unknown and narrowed before use.
const readConfig = (config: GameConfig) => config as unknown as Record<string, unknown>;

const readAllocation = (value: unknown): AllocationFields => {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return { kind: record.kind, min: record.min, max: record.max, percents: record.percents };
};

const readPositivePercents = (value: unknown): number[] | null => {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const percents: unknown[] = value;

  if (!percents.every((percent): percent is number => isFiniteNumber(percent) && percent > 0)) {
    return null;
  }

  return percents;
};

const describeRounds = (rounds: unknown) =>
  isOneOf(ROUND_OPTIONS, rounds) ? `${rounds} rounds, one year each.` : "The number of rounds is not set.";

const describeBoard = (distribution: unknown, stocksPerRound: unknown) => {
  if (!isOneOf(BOARD_DISTRIBUTION_OPTIONS, distribution) || !isOneOf(STOCKS_PER_ROUND_OPTIONS, stocksPerRound)) {
    return "The board setup is not set.";
  }

  const count = `${stocksPerRound} ${stocksPerRound === 1 ? "stock" : "stocks"} shown each round`;

  if (distribution === "onePerIndustry") {
    return `${count}, each from a different industry.`;
  }

  if (distribution === "any") {
    return `${count}, from any industry.`;
  }

  return `${count}, all from one industry.`;
};

const describePicks = (distribution: unknown) => {
  if (distribution === "onePerIndustry") {
    return "You can own one stock per industry.";
  }

  if (distribution === "any") {
    return "You can own more than one stock per industry.";
  }

  return "The pick rule is not set.";
};

const describeAllocation = (allocation: AllocationFields, startingBudget: unknown, rounds: unknown) => {
  if (allocation.kind === "equal") {
    if (!isFiniteNumber(rounds) || rounds <= 0 || !isFiniteNumber(startingBudget) || startingBudget <= 0) {
      return "Your cash is split evenly across your remaining picks.";
    }

    const perPick = floorToCents(startingBudget / rounds);

    return `Your cash is split evenly across your remaining picks. With nothing sold, that's ${formatDollars(perPick)} per pick.`;
  }

  if (allocation.kind === "range") {
    if (!isFiniteNumber(allocation.min) || !isFiniteNumber(allocation.max)) {
      return "The pick amounts are not set.";
    }

    return `Each pick uses between ${formatDollars(allocation.min)} and ${formatDollars(allocation.max)}.`;
  }

  if (allocation.kind === "steps") {
    const percents = readPositivePercents(allocation.percents);

    if (percents === null || !isFiniteNumber(startingBudget)) {
      return "The pick amounts are not set.";
    }

    const amounts = percents.map((percent) => formatDollars((percent * startingBudget) / 100));

    return `Each pick uses one of these amounts: ${listItems(amounts)}.`;
  }

  if (allocation.kind === "minPlusFree") {
    if (!isFiniteNumber(allocation.min)) {
      return "The pick amounts are not set.";
    }

    return `Each pick uses at least ${formatDollars(allocation.min)}, and you can spend any amount above that.`;
  }

  return "The pick amounts are not set.";
};

const describeHold = (holdYears: unknown) => {
  if (holdYears === "indefinite") {
    return "Stocks are held until the game ends.";
  }

  if (isFiniteNumber(holdYears) && holdYears > 0) {
    return `Stocks are held for ${holdYears} years, then sold automatically.`;
  }

  return "The hold time is not set.";
};

const describeSelling = (selling: unknown) => {
  if (selling === "none") {
    return "You cannot sell a stock.";
  }

  if (selling === "any") {
    return "You can sell any stock at any time.";
  }

  if (selling === "sameIndustry") {
    return "You can sell a stock, but you have to replace it with one from the same industry that round.";
  }

  return "The selling rule is not set.";
};

export function validateConfig(config: GameConfig): ConfigCheckResult {
  const raw = readConfig(config);
  const rounds = raw.rounds;
  const stocksPerRound = raw.stocksPerRound;
  const holdYears = raw.holdYears;
  const boardDistribution = raw.boardDistribution;
  const pickDistribution = raw.pickDistribution;
  const selling = raw.selling;
  const startingBudget = raw.startingBudget;
  const allocation = readAllocation(raw.allocation);

  const errors: ConfigIssue[] = [];
  const warnings: ConfigIssue[] = [];

  const roundsAreValid = isOneOf(ROUND_OPTIONS, rounds);
  const stocksPerRoundAreValid = isOneOf(STOCKS_PER_ROUND_OPTIONS, stocksPerRound);
  const holdYearsAreValid = isOneOf(HOLD_YEARS_OPTIONS, holdYears);
  const budgetIsValid = isFiniteNumber(startingBudget) && startingBudget > 0;
  const moneyChecksApply = roundsAreValid && budgetIsValid;

  if (!roundsAreValid) {
    errors.push({ field: "rounds", message: "Rounds must be one of 5, 6, 8, or 10." });
  }

  if (!stocksPerRoundAreValid) {
    errors.push({ field: "stocksPerRound", message: "Stocks shown per round must be one of 1, 5, 8, or 10." });
  }

  if (!holdYearsAreValid) {
    errors.push({ field: "holdYears", message: "Hold time must be 3, 5, 10 years, or indefinite." });
  }

  if (!isOneOf(BOARD_DISTRIBUTION_OPTIONS, boardDistribution)) {
    errors.push({
      field: "boardDistribution",
      message: "Board must be one per industry, any industry, or same industry.",
    });
  }

  if (!isOneOf(PICK_DISTRIBUTION_OPTIONS, pickDistribution)) {
    errors.push({ field: "pickDistribution", message: "Picks must be one per industry or any industry." });
  }

  if (!isOneOf(SELLING_OPTIONS, selling)) {
    errors.push({ field: "selling", message: "Selling must be none, any, or same industry." });
  }

  if (!budgetIsValid) {
    errors.push({ field: "startingBudget", message: "Starting budget must be more than $0." });
  }

  if (!isOneOf(ALLOCATION_KIND_OPTIONS, allocation.kind)) {
    errors.push({
      field: "allocation",
      message: "Allocation must be equal split, range, set amounts, or minimum plus any amount.",
    });
  }

  if (boardDistribution === "onePerIndustry" && stocksPerRoundAreValid && stocksPerRound > INDUSTRY_LIMIT) {
    errors.push({
      field: "stocksPerRound",
      message: `There are only ${INDUSTRY_LIMIT} industries, so a one-per-industry board can show at most ${INDUSTRY_LIMIT} stocks.`,
    });
  }

  if (pickDistribution === "onePerIndustry" && roundsAreValid && rounds > INDUSTRY_LIMIT) {
    errors.push({
      field: "rounds",
      message: `You can only own one stock per industry, so use ${INDUSTRY_LIMIT} rounds or fewer.`,
    });
  }

  if (allocation.kind === "range") {
    const min = allocation.min;
    const max = allocation.max;

    if (!isFiniteNumber(min) || min <= 0) {
      errors.push({ field: "allocation", message: "Range minimum must be a dollar amount above $0." });
    }

    if (!isFiniteNumber(max) || max <= 0) {
      errors.push({ field: "allocation", message: "Range maximum must be a dollar amount above $0." });
    } else if (isFiniteNumber(min) && min > max) {
      errors.push({ field: "allocation", message: "Range maximum must be at least the range minimum." });
    }

    if (moneyChecksApply && isFiniteNumber(min) && min > 0 && min * rounds > startingBudget) {
      errors.push({
        field: "allocation",
        message: `A ${formatDollars(min)} minimum across ${rounds} rounds needs ${formatDollars(min * rounds)}, but your budget is ${formatDollars(startingBudget)}. Lower the minimum or shorten the game.`,
      });
    }
  }

  if (allocation.kind === "steps") {
    const percents = readPositivePercents(allocation.percents);

    if (!Array.isArray(allocation.percents) || allocation.percents.length === 0) {
      errors.push({ field: "allocation", message: "Add at least one set amount." });
    } else if (percents === null) {
      errors.push({ field: "allocation", message: "Every set amount must be a percent above 0." });
    } else if (moneyChecksApply) {
      const amounts = percents.map((percent) => (percent * startingBudget) / 100);
      const smallest = Math.min(...amounts);

      if (smallest * rounds > startingBudget) {
        errors.push({
          field: "allocation",
          message: `The smallest set amount of ${formatDollars(smallest)} across ${rounds} rounds needs ${formatDollars(smallest * rounds)}, but your budget is ${formatDollars(startingBudget)}. Lower the smallest amount or shorten the game.`,
        });
      }
    }
  }

  if (allocation.kind === "minPlusFree") {
    const min = allocation.min;

    if (!isFiniteNumber(min) || min <= 0) {
      errors.push({ field: "allocation", message: "Minimum must be a dollar amount above $0." });
    } else if (moneyChecksApply && min * rounds > startingBudget) {
      errors.push({
        field: "allocation",
        message: `A ${formatDollars(min)} minimum across ${rounds} rounds needs ${formatDollars(min * rounds)}, but your budget is ${formatDollars(startingBudget)}. Lower the minimum or shorten the game.`,
      });
    }
  }

  if (holdYearsAreValid && isFiniteNumber(holdYears) && roundsAreValid && holdYears > rounds) {
    warnings.push({
      field: "holdYears",
      message: `With ${rounds} rounds and a ${holdYears}-year hold, no stock will sell before the game ends.`,
    });
  }

  if (selling === "sameIndustry" && stocksPerRound === 1) {
    warnings.push({ field: "selling", message: "Replacement rounds will only offer one stock." });
  }

  return { errors, warnings };
}

export function describeConfig(config: GameConfig): string[] {
  const raw = readConfig(config);

  return [
    describeRounds(raw.rounds),
    describeBoard(raw.boardDistribution, raw.stocksPerRound),
    describePicks(raw.pickDistribution),
    describeAllocation(readAllocation(raw.allocation), raw.startingBudget, raw.rounds),
    describeHold(raw.holdYears),
    describeSelling(raw.selling),
  ];
}