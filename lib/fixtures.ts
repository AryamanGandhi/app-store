import { INDUSTRIES, MARKET_END_YEAR, MARKET_START_YEAR, STARTING_BUDGET } from "@/lib/constants";
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

const sampleStocks = [
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

const INVENTED_NAME_PARTS_A = [
  "Aero",
  "Blue",
  "Cinder",
  "Delta",
  "Ever",
  "Flux",
  "Granite",
  "Halo",
  "Ion",
  "Juniper",
  "Keystone",
  "Lattice",
  "Meridian",
  "Nova",
  "Orbit",
  "Prairie",
  "Quartz",
  "Radiant",
  "Summit",
  "True",
  "Union",
  "Vector",
  "Willow",
  "Xylo",
  "Yield",
  "Zephyr",
] as const;

const INVENTED_NAME_PARTS_B = [
  "Atlas",
  "Beacon",
  "Circuit",
  "Dynamics",
  "Edge",
  "Forge",
  "Grid",
  "Harbor",
  "Insight",
  "Junction",
  "Labs",
  "Motors",
  "Networks",
  "Origin",
  "Peak",
  "Quantum",
  "River",
  "Stone",
  "Thera",
  "Unity",
  "Vista",
  "Works",
  "Yield",
  "Zen",
] as const;

const industryCode: Record<Industry, string> = {
  Technology: "TE",
  Healthcare: "HE",
  Financials: "FI",
  Energy: "EN",
  "Consumer Discretionary": "CD",
  "Consumer Staples": "CS",
  Industrials: "IN",
  Utilities: "UT",
};

const createYearRange = (startYear: number, endYear: number) =>
  Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);

const roundToCents = (value: number) => Math.round(value * 100) / 100;

const createSeededValue = (seed: number, ...parts: number[]) => {
  let hash = seed * 2166136261;
  for (const part of parts) {
    hash ^= part + 0x9e3779b9 + (hash << 6) + (hash >> 2);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
};

const createDeterministicPrices = (tickerIndex: number, years: number[], seed: number) => {
  const start = 5 + createSeededValue(seed, tickerIndex, 0) * 395;

  return years.map((year, yearIndex) => {
    const drift = 0.94 + createSeededValue(seed, tickerIndex, year, 1) * 0.22;
    const wave = (createSeededValue(seed, tickerIndex, year, 2) - 0.5) * 18;
    const trend = yearIndex * (1.25 + createSeededValue(seed, tickerIndex, 3) * 4.5);
    const price = Math.min(400, Math.max(5, start * drift + trend + wave));
    return roundToCents(price);
  });
};

const buildMarket = (stocks: readonly Stock[], startYear: number, endYear: number, seed: number): Market => {
  const years = createYearRange(startYear, endYear);
  const prices = Object.fromEntries(
    stocks.map((stock, index) => [
      stock.ticker,
      Object.fromEntries(createDeterministicPrices(index, years, seed).map((price, yearIndex) => [years[yearIndex], price])),
    ]),
  ) as Record<string, Record<number, number>>;

  return {
    stocks: [...stocks],
    startYear,
    endYear,
    prices,
  };
};

export const sampleMarket: Market = buildMarket(sampleStocks, MARKET_START_YEAR, MARKET_END_YEAR, 1);

export function createTestMarket(options: { perIndustry: number; startYear: number; endYear: number; seed?: number }): Market {
  const { perIndustry, startYear, endYear, seed = 1 } = options;

  const stocks: Stock[] = INDUSTRIES.flatMap((industry, industryIndex) =>
    Array.from({ length: perIndustry }, (_, stockIndex) => {
      const serial = stockIndex + 1;
      const ticker = `${industryCode[industry]}${String(serial).padStart(2, "0")}`;
      const nameA = INVENTED_NAME_PARTS_A[(industryIndex * 7 + stockIndex) % INVENTED_NAME_PARTS_A.length];
      const nameB = INVENTED_NAME_PARTS_B[(industryIndex * 5 + stockIndex * 3) % INVENTED_NAME_PARTS_B.length];

      return {
        ticker,
        name: `${nameA} ${nameB}`,
        industry,
      };
    }),
  );

  return buildMarket(stocks, startYear, endYear, seed);
}

export const sampleConfigClassic: GameConfig = {
  rounds: 8,
  stocksPerRound: 5,
  holdYears: 10,
  boardDistribution: "onePerIndustry",
  pickDistribution: "onePerIndustry",
  allocation: { kind: "equal" },
  selling: "none",
  startingBudget: STARTING_BUDGET,
};

export const sampleConfigOneShot: GameConfig = {
  rounds: 5,
  stocksPerRound: 1,
  holdYears: 5,
  boardDistribution: "any",
  pickDistribution: "any",
  allocation: { kind: "steps", percents: [10, 20, 30, 40, 50] },
  selling: "none",
  startingBudget: STARTING_BUDGET,
};

export const sampleConfigBudgetBoss: GameConfig = {
  rounds: 6,
  stocksPerRound: 8,
  holdYears: "indefinite",
  boardDistribution: "onePerIndustry",
  pickDistribution: "any",
  allocation: { kind: "minPlusFree", min: 500 },
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
  pickDistribution: "any",
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
  allocation: { kind: "equal" },
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
  shares: roundToCents(amountSpent / getPrice(ticker, yearBought)),
});

const ownedIndustryReason = (industry: Industry) => `You already own a ${industry} stock.`;

export const sampleStateRound1: GameState = {
  config: sampleConfigClassic,
  seed: 101,
  startYear: 2002,
  round: 1,
  year: 2002,
  cash: STARTING_BUDGET,
  holdings: [],
  board: ["QNT", "NVA", "AUR", "ZEN", "MIR"].map((ticker) => entry(ticker, 2002)),
  soldThisRound: [],
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
  soldThisRound: [],
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
  soldThisRound: ["ORB"],
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
  soldThisRound: [],
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
  soldThisRound: [],
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
  soldThisRound: [],
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