import type {
  BOARD_DISTRIBUTION_OPTIONS,
  HOLD_YEARS_OPTIONS,
  INDUSTRIES,
  PICK_DISTRIBUTION_OPTIONS,
  ROUND_OPTIONS,
  SELLING_OPTIONS,
  STOCKS_PER_ROUND_OPTIONS,
} from "@/lib/constants";

export type Industry = (typeof INDUSTRIES)[number];
export type Stock = { ticker: string; name: string; industry: Industry };
export type Market = {
  stocks: Stock[];
  startYear: number;
  endYear: number;
  prices: Record<string, Record<number, number>>;
};
export type Rounds = (typeof ROUND_OPTIONS)[number];
export type StocksPerRound = (typeof STOCKS_PER_ROUND_OPTIONS)[number];
export type HoldYears = (typeof HOLD_YEARS_OPTIONS)[number];
export type BoardDistribution = (typeof BOARD_DISTRIBUTION_OPTIONS)[number];
export type PickDistribution = (typeof PICK_DISTRIBUTION_OPTIONS)[number];
export type SellingRule = (typeof SELLING_OPTIONS)[number];
export type AllocationRule =
  // Each pick gets current cash divided by picks left (including this one), rounded down to the cent. The last pick gets all remaining cash.
  | { kind: "equal" }
  | { kind: "range"; min: number; max: number }
  | { kind: "steps"; percents: number[] }
  | { kind: "minPlusFree"; min: number };
export type AllocationKind = AllocationRule["kind"];
export type GameConfig = {
  rounds: Rounds;
  stocksPerRound: StocksPerRound;
  holdYears: HoldYears;
  boardDistribution: BoardDistribution;
  pickDistribution: PickDistribution;
  allocation: AllocationRule;
  selling: SellingRule;
  startingBudget: number;
};
export type Mode = {
  slug: string;
  name: string;
  tagline: string;
  accentColor: string;
  config: GameConfig;
  tags: string[];
  rules: string[];
};
export type BoardEntry = { stock: Stock; price: number; pickable: boolean; reason: string | null };
export type Holding = {
  id: string;
  ticker: string;
  name: string;
  industry: Industry;
  yearBought: number;
  amountSpent: number;
  shares: number;
};
export type GameEvent = { id: string; kind: "autoSell" | "sell"; message: string };
export type GameStatus = "playing" | "done";
export type GameState = {
  config: GameConfig;
  seed: number;
  startYear: number;
  round: number;
  year: number;
  cash: number;
  holdings: Holding[];
  board: BoardEntry[];
  // Tickers sold this round; used to block rebuying a stock in the same round it was sold and to block a second sale in same-industry selling.
  soldThisRound: string[];
  mustReplaceIndustry: Industry | null;
  events: GameEvent[];
  status: GameStatus;
};
export type GameAction =
  | { type: "BUY"; ticker: string; amount: number }
  | { type: "SELL"; holdingId: string }
  | { type: "SKIP" }
  | { type: "RESTART"; seed: number };
export type SpendStep = { percent: number; amount: number; enabled: boolean };
export type SpendOptions = {
  kind: AllocationKind;
  canBuy: boolean;
  min: number;
  max: number;
  fixedAmount: number | null;
  steps: SpendStep[];
  reserved: number;
};
export type SellCheck = { allowed: boolean; reason: string | null };
export type ConfigIssue = { field: keyof GameConfig; message: string };
export type ConfigCheckResult = { errors: ConfigIssue[]; warnings: ConfigIssue[] };