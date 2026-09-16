export const STARTING_BUDGET = 10000;
export const MARKET_START_YEAR = 2000;
export const MARKET_END_YEAR = 2024;
export const GAME_START_YEAR_MIN = 2000;
export const GAME_START_YEAR_MAX = 2010;

export const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Financials",
  "Energy",
  "Consumer Discretionary",
  "Consumer Staples",
  "Industrials",
  "Utilities",
] as const;

export const ROUND_OPTIONS = [5, 6, 8, 10] as const;
export const STOCKS_PER_ROUND_OPTIONS = [1, 5, 8, 10] as const;
export const HOLD_YEARS_OPTIONS = [3, 5, 10, "indefinite"] as const;
export const BOARD_DISTRIBUTION_OPTIONS = ["onePerIndustry", "any", "sameIndustry"] as const;
export const PICK_DISTRIBUTION_OPTIONS = ["onePerIndustry", "any"] as const;
export const ALLOCATION_KIND_OPTIONS = ["equal", "range", "steps", "minPlusFree"] as const;
export const SELLING_OPTIONS = ["none", "any", "sameIndustry"] as const;