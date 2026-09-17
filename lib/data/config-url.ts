import {
  ALLOCATION_KIND_OPTIONS,
  BOARD_DISTRIBUTION_OPTIONS,
  PICK_DISTRIBUTION_OPTIONS,
  ROUND_OPTIONS,
  SELLING_OPTIONS,
  STARTING_BUDGET,
  STOCKS_PER_ROUND_OPTIONS,
} from "@/lib/constants";
import type { GameConfig } from "@/lib/types";

const NUMERIC_HOLD_OPTIONS = [3, 5, 10] as const;

const isStringOption = <T extends string>(options: readonly T[], value: string | null): value is T =>
  value !== null && options.includes(value as T);

const isNumberOption = <T extends number>(options: readonly T[], value: number | null): value is T =>
  value !== null && options.includes(value as T);

const parseInteger = (value: string | null) => {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
};

const parseSteps = (value: string | null) => {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parts = value.split(",");
  const percents = parts.map((part) => parseInteger(part));

  if (percents.some((percent) => percent === null)) {
    return null;
  }

  return percents as number[];
};

export function configToParams(config: GameConfig): Record<string, string> {
  const params: Record<string, string> = {
    rounds: String(config.rounds),
    stocks: String(config.stocksPerRound),
    hold: String(config.holdYears),
    board: config.boardDistribution,
    picks: config.pickDistribution,
    money: config.allocation.kind,
    sell: config.selling,
  };

  switch (config.allocation.kind) {
    case "equal":
      break;
    case "range":
      params.min = String(config.allocation.min);
      params.max = String(config.allocation.max);
      break;
    case "steps":
      params.steps = config.allocation.percents.join(",");
      break;
    case "minPlusFree":
      params.min = String(config.allocation.min);
      break;
  }

  return params;
}

export function paramsToConfig(params: URLSearchParams): GameConfig | null {
  const roundsValue = parseInteger(params.get("rounds"));
  const stocksValue = parseInteger(params.get("stocks"));
  const holdParam = params.get("hold");
  const holdValue = holdParam === "indefinite" ? "indefinite" : parseInteger(holdParam);
  const boardValue = params.get("board");
  const picksValue = params.get("picks");
  const moneyValue = params.get("money");
  const sellValue = params.get("sell");

  if (!isNumberOption(ROUND_OPTIONS, roundsValue)) {
    return null;
  }

  if (!isNumberOption(STOCKS_PER_ROUND_OPTIONS, stocksValue)) {
    return null;
  }

  if (!(holdValue === "indefinite" || isNumberOption(NUMERIC_HOLD_OPTIONS, holdValue))) {
    return null;
  }

  if (!isStringOption(BOARD_DISTRIBUTION_OPTIONS, boardValue)) {
    return null;
  }

  if (!isStringOption(PICK_DISTRIBUTION_OPTIONS, picksValue)) {
    return null;
  }

  if (!isStringOption(ALLOCATION_KIND_OPTIONS, moneyValue)) {
    return null;
  }

  if (!isStringOption(SELLING_OPTIONS, sellValue)) {
    return null;
  }

  let allocation: GameConfig["allocation"];

  switch (moneyValue) {
    case "equal":
      allocation = { kind: "equal" };
      break;
    case "range": {
      const min = parseInteger(params.get("min"));
      const max = parseInteger(params.get("max"));

      if (min === null || max === null) {
        return null;
      }

      allocation = { kind: "range", min, max };
      break;
    }
    case "steps": {
      const percents = parseSteps(params.get("steps"));

      if (percents === null) {
        return null;
      }

      allocation = { kind: "steps", percents };
      break;
    }
    case "minPlusFree": {
      const min = parseInteger(params.get("min"));

      if (min === null) {
        return null;
      }

      allocation = { kind: "minPlusFree", min };
      break;
    }
  }

  return {
    rounds: roundsValue,
    stocksPerRound: stocksValue,
    holdYears: holdValue,
    boardDistribution: boardValue,
    pickDistribution: picksValue,
    allocation,
    selling: sellValue,
    startingBudget: STARTING_BUDGET,
  };
}