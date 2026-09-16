import { MARKET_START_YEAR, STARTING_BUDGET } from "@/lib/constants";
import type {
  BoardEntry,
  GameConfig,
  GameState,
  Holding,
  Industry,
  Market,
  SpendOptions,
  Stock,
} from "@/lib/types";

const stocks = [
  { ticker: "QNT", name: "Quantara Systems", industry: "Technology" },
  { ticker: "LMX", name: "Lumex Grid", industry: "Technology" },
  { ticker: "VYT", name: "Vytron Labs", industry: "Technology" },
  { ticker: "NVA", name: "Novalytix Care", industry: "Healthcare" },
  { ticker: "ELM", name: "Elmstone Bio", industry: "Healthcare" },
  { ticker: "PRX", name: "Praxis Pulse", industry: "Healthcare" },
  { ticker: "AUR", name: "Auren Ledger", industry: "Financials" },
  { ticker: "BNQ", name: "Banquil Capital", industry: "Financials" },
  { ticker: "CRD", name: "Cinder Crest Finance", industry: "Financials" },
  { ticker: "ZEN", name: "Zenith Fuelworks", industry: "Energy" },
  { ticker: "ORB", name: "Orbaline Power", industry: "Energy" },
  { ticker: "KVA", name: "Kavaro Drilling", industry: "Energy" },
  { ticker: "MIR", name: "Mirador Retail", industry: "Consumer Discretionary" },
  { ticker: "TUL", name: "Tulric Leisure", industry: "Consumer Discretionary" },
  { ticker: "BEX", name: "Bexley Drive", industry: "Consumer Discretionary" },
  { ticker: "HAR", name: "Harbor Basket", industry: "Consumer Staples" },
  { ticker: "GLN", name: "Glenvale Goods", industry: "Consumer Staples" },
  { ticker: "SPR", name: "Spruce Pantry", industry: "Consumer Staples" },
  { ticker: "DRV", name: "Drivon Works", industry: "Industrials" },
  { ticker: "MKT", name: "Marketal Forge", industry: "Industrials" },
  { ticker: "RIV", name: "Rivet Peak", industry: "Industrials" },
  { ticker: "LUX", name: "Luxara Water", industry: "Utilities" },
  { ticker: "GRD", name: "Gridline Civic", industry: "Utilities" },
  { ticker: "PNL", name: "Panelis Flow", industry: "Utilities" },
] as const satisfies readonly Stock[];

const years = Array.from({ length: 15 }, (_, index) => MARKET_START_YEAR + index);

const priceMatrix: Record<string, number[]> = {
  QNT: [48.15, 52.44, 57.81, 61.38, 66.9, 71.12, 74.65, 80.41, 86.2, 92.55, 98.13, 104.76, 109.22, 117.45, 123.88],
  LMX: [31.72, 34.08, 36.49, 40.16, 42.73, 45.2, 47.89, 51.77, 55.19, 59.4, 63.18, 67.02, 69.58, 73.11, 77.64],
  VYT: [72.09, 75.33, 79.8, 83.42, 88.74, 91.61, 95.87, 100.22, 105.44, 111.9, 118.37, 124.89, 129.73, 135.68, 141.52],
  NVA: [55.48, 58.12, 60.25, 64.77, 67.41, 70.86, 73.92, 76.13, 79.46, 82.57, 85.35, 89.24, 92.48, 95.71, 99.05],
  ELM: [24.31, 25.49, 27.02, 28.8, 30.11, 31.67, 33.05, 34.98, 36.44, 38.27, 39.89, 41.76, 43.12, 44.95, 46.38],
  PRX: [112.4, 115.26, 118.91, 123.08, 126.37, 129.92, 133.55, 138.61, 142.17, 146.44, 149.83, 154.07, 157.66, 161.94, 166.28],
  AUR: [65.14, 67.58, 69.93, 72.64, 74.88, 77.43, 79.95, 82.37, 84.94, 87.51, 90.06, 93.12, 95.4, 98.23, 101.18],
  BNQ: [18.55, 19.26, 20.04, 20.88, 21.7, 22.65, 23.48, 24.11, 24.92, 25.86, 26.71, 27.62, 28.1, 28.94, 29.82],
  CRD: [92.77, 95.48, 98.14, 101.39, 104.22, 107.11, 110.35, 113.47, 116.91, 120.56, 123.72, 126.8, 130.44, 134.29, 138.4],
  ZEN: [39.64, 42.17, 44.92, 48.08, 51.4, 55.83, 59.26, 63.48, 67.92, 71.37, 74.98, 78.61, 82.29, 86.74, 90.55],
  ORB: [83.92, 81.16, 78.45, 76.24, 73.89, 70.44, 68.77, 66.11, 64.39, 62.85, 60.73, 59.12, 57.88, 56.43, 55.09],
  KVA: [27.48, 29.55, 31.01, 33.27, 35.9, 37.15, 39.78, 41.96, 44.5, 46.83, 49.25, 51.9, 54.16, 56.72, 58.93],
  MIR: [44.21, 46.74, 49.38, 53.84, 57.62, 61.13, 64.57, 69.06, 73.45, 77.39, 81.88, 86.2, 90.54, 95.81, 100.62],
  TUL: [15.88, 16.79, 17.72, 18.64, 19.82, 20.69, 21.77, 22.95, 24.3, 25.41, 26.58, 27.89, 29.22, 30.66, 31.9],
  BEX: [59.43, 61.17, 63.4, 66.85, 69.04, 71.61, 73.98, 76.54, 79.03, 81.62, 84.18, 86.43, 89.14, 92.05, 95.28],
  HAR: [22.14, 22.89, 23.66, 24.44, 25.26, 26.09, 26.87, 27.74, 28.63, 29.4, 30.18, 31.06, 31.93, 32.85, 33.74],
  GLN: [34.88, 35.96, 36.94, 38.12, 39.08, 40.15, 41.27, 42.41, 43.52, 44.73, 45.87, 46.96, 48.14, 49.25, 50.41],
  SPR: [12.37, 12.95, 13.44, 13.92, 14.46, 15.01, 15.57, 16.11, 16.72, 17.3, 17.92, 18.51, 19.08, 19.74, 20.31],
  DRV: [71.25, 74.11, 76.95, 80.42, 83.58, 86.74, 89.96, 93.23, 96.84, 100.08, 103.37, 107.42, 110.91, 114.38, 118.12],
  MKT: [28.76, 29.88, 31.14, 32.59, 34.08, 35.42, 36.95, 38.67, 40.29, 41.93, 43.55, 45.11, 46.78, 48.32, 49.97],
  RIV: [97.31, 100.24, 103.55, 107.18, 110.64, 114.1, 117.78, 121.39, 125.21, 129.18, 133.05, 137.12, 141.26, 145.53, 149.88],
  LUX: [41.53, 42.66, 43.92, 45.17, 46.39, 47.72, 49.05, 50.44, 51.77, 53.18, 54.57, 56.04, 57.38, 58.92, 60.35],
  GRD: [66.84, 67.91, 69.04, 70.18, 71.37, 72.61, 73.94, 75.22, 76.57, 77.91, 79.35, 80.88, 82.31, 83.86, 85.44],
  PNL: [19.42, 19.96, 20.55, 21.13, 21.74, 22.33, 22.98, 23.64, 24.28, 24.95, 25.67, 26.41, 27.08, 27.83, 28.57],
};

const prices: Record<string, Record<number, number>> = Object.fromEntries(
  Object.entries(priceMatrix).map(([ticker, values]) => [ticker, Object.fromEntries(values.map((price, index) => [years[index], price]))]),
) as Record<string, Record<number, number>>;

export const sampleMarket: Market = {
  stocks: [...stocks],
  startYear: 2000,
  endYear: 2014,
  prices,
};

export const sampleConfigClassic: GameConfig = {
  rounds: 8,
  stocksPerRound: 5,
  holdYears: 10,
  boardDistribution: "onePerIndustry",
  pickDistribution: "onePerIndustry",
  allocation: { kind: "equal", amountPerPick: 1250 },
  selling: "none",
  startingBudget: STARTING_BUDGET,
};

export const sampleConfigActive: GameConfig = {
  rounds: 10,
  stocksPerRound: 10,
  holdYears: 3,
  boardDistribution: "any",
  pickDistribution: "any",
  allocation: { kind: "range", min: 500, max: 3000 },
  selling: "any",
  startingBudget: STARTING_BUDGET,
};

export const sampleConfigSwap: GameConfig = {
  rounds: 8,
  stocksPerRound: 8,
  holdYears: "indefinite",
  boardDistribution: "onePerIndustry",
  pickDistribution: "onePerIndustry",
  allocation: { kind: "steps", percents: [5, 10, 15, 20, 25] },
  selling: "sameIndustry",
  startingBudget: STARTING_BUDGET,
};

export const sampleConfigFocus: GameConfig = {
  rounds: 8,
  stocksPerRound: 5,
  holdYears: 5,
  boardDistribution: "sameIndustry",
  pickDistribution: "any",
  allocation: { kind: "equal", amountPerPick: 1250 },
  selling: "none",
  startingBudget: STARTING_BUDGET,
};

const stockByTicker = Object.fromEntries(sampleMarket.stocks.map((stock) => [stock.ticker, stock])) as Record<string, Stock>;
const getStock = (ticker: string) => stockByTicker[ticker];
const getPrice = (ticker: string, year: number) => sampleMarket.prices[ticker][year];
const entry = (ticker: string, year: number, pickable = true, reason: string | null = null): BoardEntry => ({
  stock: getStock(ticker),
  price: getPrice(ticker, year),
  pickable,
  reason,
});
const holding = (id: string, ticker: string, yearBought: number, amountSpent: number): Holding => ({
  id,
  ticker,
  name: getStock(ticker).name,
  industry: getStock(ticker).industry,
  yearBought,
  amountSpent,
  shares: Number((amountSpent / getPrice(ticker, yearBought)).toFixed(4)),
});
const ownedIndustryReason = (industry: Industry) => `You already own a ${industry} stock.`;

export const sampleStateRound1: GameState = {
  config: sampleConfigClassic,
  seed: 101,
  startYear: 2002,
  round: 1,
  year: 2002,
  cash: 10000,
  holdings: [],
  board: ["QNT", "NVA", "AUR", "ZEN", "MIR"].map((ticker) => entry(ticker, 2002)),
  mustReplaceIndustry: null,
  events: [],
  status: "playing",
};

export const sampleStateMidGame: GameState = {
  config: sampleConfigActive,
  seed: 202,
  startYear: 2002,
  round: 4,
  year: 2005,
  cash: 4500,
  holdings: [holding("holding-active-1", "QNT", 2002, 1500), holding("holding-active-2", "NVA", 2003, 2250), holding("holding-active-3", "ZEN", 2004, 1750)],
  board: ["LMX", "VYT", "ELM", "PRX", "BNQ", "CRD", "ORB", "KVA", "TUL", "HAR"].map((ticker) => entry(ticker, 2005)),
  mustReplaceIndustry: null,
  events: [
    {
      id: "event-auto-sell-1",
      kind: "autoSell",
      message: "A previous 2002 hold ended automatically this round, sold for $1,840.",
    },
  ],
  status: "playing",
};

export const sampleStateReplace: GameState = {
  config: sampleConfigSwap,
  seed: 303,
  startYear: 2002,
  round: 3,
  year: 2004,
  cash: 7000,
  holdings: [holding("holding-swap-1", "QNT", 2002, 2000), holding("holding-swap-2", "ORB", 2003, 1000)],
  board: [
    entry("ZEN", 2004),
    entry("KVA", 2004),
    entry("NVA", 2004, false, "Replace your Energy stock first."),
    entry("AUR", 2004, false, "Replace your Energy stock first."),
    entry("MIR", 2004, false, "Replace your Energy stock first."),
    entry("HAR", 2004, false, "Replace your Energy stock first."),
    entry("DRV", 2004, false, "Replace your Energy stock first."),
    entry("LUX", 2004, false, "Replace your Energy stock first."),
  ],
  mustReplaceIndustry: "Energy",
  events: [
    {
      id: "event-sell-1",
      kind: "sell",
      message: "Orbaline Power was sold and must be replaced with another Energy stock.",
    },
  ],
  status: "playing",
};

export const sampleStateSameIndustry: GameState = {
  config: sampleConfigFocus,
  seed: 404,
  startYear: 2002,
  round: 2,
  year: 2003,
  cash: 8750,
  holdings: [holding("holding-focus-1", "MIR", 2002, 1250)],
  board: ["MIR", "TUL", "BEX"].map((ticker) => entry(ticker, 2003)),
  mustReplaceIndustry: null,
  events: [],
  status: "playing",
};

export const sampleStateBlocked: GameState = {
  config: sampleConfigClassic,
  seed: 505,
  startYear: 2002,
  round: 5,
  year: 2006,
  cash: 5000,
  holdings: [
    holding("holding-blocked-1", "QNT", 2002, 1250),
    holding("holding-blocked-2", "NVA", 2003, 1250),
    holding("holding-blocked-3", "AUR", 2004, 1250),
    holding("holding-blocked-4", "ZEN", 2005, 1250),
  ],
  board: [
    entry("LMX", 2006, false, ownedIndustryReason("Technology")),
    entry("ELM", 2006, false, ownedIndustryReason("Healthcare")),
    entry("BNQ", 2006, false, ownedIndustryReason("Financials")),
    entry("KVA", 2006, false, ownedIndustryReason("Energy")),
    entry("HAR", 2006),
  ],
  mustReplaceIndustry: null,
  events: [],
  status: "playing",
};

export const sampleStateGameOver: GameState = {
  config: sampleConfigClassic,
  seed: 606,
  startYear: 2002,
  round: 8,
  year: 2009,
  cash: 250,
  holdings: [
    holding("holding-over-1", "QNT", 2002, 1250),
    holding("holding-over-2", "NVA", 2002, 1250),
    holding("holding-over-3", "AUR", 2003, 1250),
    holding("holding-over-4", "ZEN", 2003, 1250),
    holding("holding-over-5", "MIR", 2004, 1250),
    holding("holding-over-6", "HAR", 2004, 1250),
    holding("holding-over-7", "DRV", 2005, 1250),
    holding("holding-over-8", "LUX", 2005, 1000),
  ],
  board: [],
  mustReplaceIndustry: null,
  events: [],
  status: "done",
};

export const sampleSpendEqual: SpendOptions = {
  kind: "equal",
  canBuy: true,
  min: 1250,
  max: 1250,
  fixedAmount: 1250,
  steps: [],
  reserved: 8750,
};

export const sampleSpendRange: SpendOptions = {
  kind: "range",
  canBuy: true,
  min: 500,
  max: 3000,
  fixedAmount: null,
  steps: [],
  reserved: 4500,
};

export const sampleSpendSteps: SpendOptions = {
  kind: "steps",
  canBuy: true,
  min: 1000,
  max: 3000,
  fixedAmount: null,
  steps: [
    { percent: 10, amount: 1000, enabled: true },
    { percent: 20, amount: 2000, enabled: true },
    { percent: 30, amount: 3000, enabled: true },
    { percent: 40, amount: 4000, enabled: false },
    { percent: 50, amount: 5000, enabled: false },
  ],
  reserved: 2000,
};

export const sampleSpendMinPlusFree: SpendOptions = {
  kind: "minPlusFree",
  canBuy: true,
  min: 500,
  max: 6500,
  fixedAmount: null,
  steps: [],
  reserved: 2500,
};

export const sampleSpendBlocked: SpendOptions = {
  kind: "range",
  canBuy: false,
  min: 500,
  max: 300,
  fixedAmount: null,
  steps: [],
  reserved: 1500,
};