import { describe, expect, it } from "vitest";
import { STARTING_BUDGET } from "@/lib/constants";
import { describeConfig, validateConfig } from "@/lib/engine";
import {
  sampleConfigActive,
  sampleConfigBudgetBoss,
  sampleConfigClassic,
  sampleConfigFocus,
  sampleConfigOneShot,
  sampleConfigSwap,
} from "@/lib/fixtures";
import type { GameConfig } from "@/lib/types";

const classic: GameConfig = {
  rounds: 8,
  stocksPerRound: 5,
  holdYears: 10,
  boardDistribution: "onePerIndustry",
  pickDistribution: "onePerIndustry",
  allocation: { kind: "equal" },
  selling: "none",
  startingBudget: STARTING_BUDGET,
};

const oneShot: GameConfig = {
  rounds: 5,
  stocksPerRound: 1,
  holdYears: 5,
  boardDistribution: "any",
  pickDistribution: "any",
  allocation: { kind: "steps", percents: [10, 20, 30, 40, 50] },
  selling: "none",
  startingBudget: STARTING_BUDGET,
};

const budgetBoss: GameConfig = {
  rounds: 6,
  stocksPerRound: 8,
  holdYears: "indefinite",
  boardDistribution: "onePerIndustry",
  pickDistribution: "any",
  allocation: { kind: "minPlusFree", min: 500 },
  selling: "none",
  startingBudget: STARTING_BUDGET,
};

const activeTrader: GameConfig = {
  rounds: 10,
  stocksPerRound: 10,
  holdYears: 3,
  boardDistribution: "any",
  pickDistribution: "any",
  allocation: { kind: "range", min: 500, max: 3000 },
  selling: "any",
  startingBudget: STARTING_BUDGET,
};

const sectorSwap: GameConfig = {
  rounds: 8,
  stocksPerRound: 8,
  holdYears: "indefinite",
  boardDistribution: "onePerIndustry",
  pickDistribution: "any",
  allocation: { kind: "steps", percents: [5, 10, 15, 20, 25] },
  selling: "sameIndustry",
  startingBudget: STARTING_BUDGET,
};

const sectorFocus: GameConfig = {
  rounds: 8,
  stocksPerRound: 5,
  holdYears: 5,
  boardDistribution: "sameIndustry",
  pickDistribution: "any",
  allocation: { kind: "equal" },
  selling: "none",
  startingBudget: STARTING_BUDGET,
};

const presets = [classic, oneShot, budgetBoss, activeTrader, sectorSwap, sectorFocus];

// Builds configs with the kind of values a hand-edited URL could contain.
const configWith = (overrides: Record<string, unknown>): GameConfig =>
  ({ ...classic, ...overrides }) as unknown as GameConfig;

describe("preset configs", () => {
  it("matches the shared sample configs in lib/fixtures.ts", () => {
    expect(presets).toEqual([
      sampleConfigClassic,
      sampleConfigOneShot,
      sampleConfigBudgetBoss,
      sampleConfigActive,
      sampleConfigSwap,
      sampleConfigFocus,
    ]);
  });

  it("reports no errors for any preset", () => {
    for (const preset of presets) {
      expect(validateConfig(preset).errors).toEqual([]);
    }
  });

  it("warns that Classic Draft's hold runs longer than the game", () => {
    expect(validateConfig(classic).warnings).toEqual([
      {
        field: "holdYears",
        message: "With 8 rounds and a 10-year hold, no stock will sell before the game ends.",
      },
    ]);
  });

  it("warns that One Shot's hold runs as long as the game", () => {
    expect(validateConfig(oneShot).warnings).toEqual([
      {
        field: "holdYears",
        message: "With 5 rounds and a 5-year hold, no stock will sell before the game ends.",
      },
    ]);
  });

  it("reports no warnings for the other four presets", () => {
    for (const preset of [budgetBoss, activeTrader, sectorSwap, sectorFocus]) {
      expect(validateConfig(preset).warnings).toEqual([]);
    }
  });
});

const errorCases: { title: string; config: GameConfig; field: keyof GameConfig; message: string }[] = [
  {
    title: "rounds is not an allowed value",
    config: configWith({ rounds: 7 }),
    field: "rounds",
    message: "Rounds must be one of 5, 6, 8, or 10.",
  },
  {
    title: "stocks per round is not an allowed value",
    config: configWith({ stocksPerRound: 2 }),
    field: "stocksPerRound",
    message: "Stocks shown per round must be one of 1, 5, 8, or 10.",
  },
  {
    title: "hold time is not an allowed value",
    config: configWith({ holdYears: 7 }),
    field: "holdYears",
    message: "Hold time must be 3, 5, 10 years, or indefinite.",
  },
  {
    title: "board is not an allowed value",
    config: configWith({ boardDistribution: "perIndustry" }),
    field: "boardDistribution",
    message: "Board must be one per industry, any industry, or same industry.",
  },
  {
    title: "picks are not an allowed value",
    config: configWith({ pickDistribution: "all" }),
    field: "pickDistribution",
    message: "Picks must be one per industry or any industry.",
  },
  {
    title: "selling is not an allowed value",
    config: configWith({ selling: "half" }),
    field: "selling",
    message: "Selling must be none, any, or same industry.",
  },
  {
    title: "allocation is not an allowed value",
    config: configWith({ allocation: { kind: "random" } }),
    field: "allocation",
    message: "Allocation must be equal split, range, set amounts, or minimum plus any amount.",
  },
  {
    title: "the starting budget is zero",
    config: configWith({ startingBudget: 0 }),
    field: "startingBudget",
    message: "Starting budget must be more than $0.",
  },
  {
    title: "the starting budget is negative",
    config: configWith({ startingBudget: -500 }),
    field: "startingBudget",
    message: "Starting budget must be more than $0.",
  },
  {
    title: "a one-per-industry board shows more than 8 stocks",
    config: configWith({ stocksPerRound: 10 }),
    field: "stocksPerRound",
    message: "There are only 8 industries, so a one-per-industry board can show at most 8 stocks.",
  },
  {
    title: "one-per-industry picks run past 8 rounds",
    config: configWith({ rounds: 10 }),
    field: "rounds",
    message: "You can only own one stock per industry, so use 8 rounds or fewer.",
  },
  {
    title: "a range minimum is zero",
    config: configWith({ allocation: { kind: "range", min: 0, max: 3000 } }),
    field: "allocation",
    message: "Range minimum must be a dollar amount above $0.",
  },
  {
    title: "a range maximum is below the minimum",
    config: configWith({ allocation: { kind: "range", min: 3000, max: 500 } }),
    field: "allocation",
    message: "Range maximum must be at least the range minimum.",
  },
  {
    title: "a range minimum cannot cover every round",
    config: configWith({ allocation: { kind: "range", min: 2000, max: 3000 } }),
    field: "allocation",
    message:
      "A $2,000 minimum across 8 rounds needs $16,000, but your budget is $10,000. Lower the minimum or shorten the game.",
  },
  {
    title: "the set amounts list is empty",
    config: configWith({ allocation: { kind: "steps", percents: [] } }),
    field: "allocation",
    message: "Add at least one set amount.",
  },
  {
    title: "a set amount percent is zero",
    config: configWith({ allocation: { kind: "steps", percents: [0, 25] } }),
    field: "allocation",
    message: "Every set amount must be a percent above 0.",
  },
  {
    title: "the smallest set amount cannot cover every round",
    config: configWith({ allocation: { kind: "steps", percents: [30, 40, 50] } }),
    field: "allocation",
    message:
      "The smallest set amount of $3,000 across 8 rounds needs $24,000, but your budget is $10,000. Lower the smallest amount or shorten the game.",
  },
  {
    title: "the minimum plus any amount minimum is zero",
    config: configWith({ allocation: { kind: "minPlusFree", min: 0 } }),
    field: "allocation",
    message: "Minimum must be a dollar amount above $0.",
  },
  {
    title: "the minimum plus any amount minimum cannot cover every round",
    config: configWith({ rounds: 6, allocation: { kind: "minPlusFree", min: 2000 } }),
    field: "allocation",
    message:
      "A $2,000 minimum across 6 rounds needs $12,000, but your budget is $10,000. Lower the minimum or shorten the game.",
  },
];

describe("validateConfig warnings", () => {
  it("warns when the hold is as long as the game", () => {
    expect(validateConfig(configWith({ rounds: 5, holdYears: 5 })).warnings).toContainEqual({
      field: "holdYears",
      message: "With 5 rounds and a 5-year hold, no stock will sell before the game ends.",
    });

    const tenRoundConfig = configWith({ rounds: 10, holdYears: 10, pickDistribution: "any" });

    expect(validateConfig(tenRoundConfig).warnings).toContainEqual({
      field: "holdYears",
      message: "With 10 rounds and a 10-year hold, no stock will sell before the game ends.",
    });
  });

  it("warns when the hold runs past the end of the game", () => {
    expect(validateConfig(configWith({ rounds: 5, holdYears: 10 })).warnings).toContainEqual({
      field: "holdYears",
      message: "With 5 rounds and a 10-year hold, no stock will sell before the game ends.",
    });
  });

  it("warns that same-industry selling only offers one replacement stock", () => {
    expect(
      validateConfig(configWith({ stocksPerRound: 1, selling: "sameIndustry", holdYears: 5 })).warnings,
    ).toContainEqual({
      field: "selling",
      message: "Replacement rounds will only offer one stock.",
    });
  });

  it("does not warn when the hold fits inside the game", () => {
    expect(validateConfig(configWith({ rounds: 6, holdYears: 5 })).warnings).toEqual([]);
    expect(validateConfig(configWith({ holdYears: 5 })).warnings).toEqual([]);
    expect(validateConfig(configWith({ rounds: 10, holdYears: 3, pickDistribution: "any" })).warnings).toEqual([]);
    expect(validateConfig(configWith({ holdYears: "indefinite" })).warnings).toEqual([]);
  });

  it("does not warn about same-industry selling when more than one stock is shown", () => {
    const config = configWith({ stocksPerRound: 5, selling: "sameIndustry", holdYears: 5 });

    expect(validateConfig(config).warnings).toEqual([]);
  });
});

describe("describeConfig preset sentences", () => {
  const splitSentence = "Your cash is split evenly across your remaining picks. With nothing sold, that's $1,250 per pick.";

  it("describes Classic Draft", () => {
    expect(describeConfig(classic)).toEqual([
      "8 rounds, one year each.",
      "5 stocks shown each round, each from a different industry.",
      "You can own one stock per industry.",
      splitSentence,
      "Stocks are held for 10 years, then sold automatically.",
      "You cannot sell a stock.",
    ]);
  });

  it("describes One Shot", () => {
    expect(describeConfig(oneShot)).toEqual([
      "5 rounds, one year each.",
      "1 stock shown each round, from any industry.",
      "You can own more than one stock per industry.",
      "Each pick uses one of these amounts: $1,000, $2,000, $3,000, $4,000, or $5,000.",
      "Stocks are held for 5 years, then sold automatically.",
      "You cannot sell a stock.",
    ]);
  });

  it("describes Budget Boss", () => {
    expect(describeConfig(budgetBoss)).toEqual([
      "6 rounds, one year each.",
      "8 stocks shown each round, each from a different industry.",
      "You can own more than one stock per industry.",
      "Each pick uses at least $500, and you can spend any amount above that.",
      "Stocks are held until the game ends.",
      "You cannot sell a stock.",
    ]);
  });

  it("describes Active Trader", () => {
    expect(describeConfig(activeTrader)).toEqual([
      "10 rounds, one year each.",
      "10 stocks shown each round, from any industry.",
      "You can own more than one stock per industry.",
      "Each pick uses between $500 and $3,000.",
      "Stocks are held for 3 years, then sold automatically.",
      "You can sell any stock at any time.",
    ]);
  });

  it("describes Sector Swap", () => {
    expect(describeConfig(sectorSwap)).toEqual([
      "8 rounds, one year each.",
      "8 stocks shown each round, each from a different industry.",
      "You can own more than one stock per industry.",
      "Each pick uses one of these amounts: $500, $1,000, $1,500, $2,000, or $2,500.",
      "Stocks are held until the game ends.",
      "You can sell a stock, but you have to replace it with one from the same industry that round.",
    ]);
  });

  it("describes Sector Focus", () => {
    expect(describeConfig(sectorFocus)).toEqual([
      "8 rounds, one year each.",
      "5 stocks shown each round, all from one industry.",
      "You can own more than one stock per industry.",
      splitSentence,
      "Stocks are held for 5 years, then sold automatically.",
      "You cannot sell a stock.",
    ]);
  });
});

describe("validateConfig errors", () => {
  it.each(errorCases)("reports an error on $field when $title", ({ config, field, message }) => {
    expect(validateConfig(config).errors).toContainEqual({ field, message });
  });

  it("reports no errors for a playable config", () => {
    expect(validateConfig(configWith({})).errors).toEqual([]);
  });

  it("does not throw on values a hand-edited URL could contain", () => {
    const broken = configWith({ rounds: "eight", holdYears: [], allocation: null });

    expect(() => validateConfig(broken)).not.toThrow();
    expect(validateConfig(broken).errors.length).toBeGreaterThan(0);
  });
});

describe("describeConfig setting values", () => {
  const roundsCases = [
    { rounds: 5, sentence: "5 rounds, one year each." },
    { rounds: 6, sentence: "6 rounds, one year each." },
    { rounds: 8, sentence: "8 rounds, one year each." },
    { rounds: 10, sentence: "10 rounds, one year each." },
  ];

  it.each(roundsCases)("describes $rounds rounds", ({ rounds, sentence }) => {
    expect(describeConfig(configWith({ rounds }))[0]).toBe(sentence);
  });

  const pickCases = [
    { pickDistribution: "onePerIndustry", sentence: "You can own one stock per industry." },
    { pickDistribution: "any", sentence: "You can own more than one stock per industry." },
  ];

  it.each(pickCases)("describes $pickDistribution picks", ({ pickDistribution, sentence }) => {
    expect(describeConfig(configWith({ pickDistribution }))[2]).toBe(sentence);
  });

  const holdCases = [
    { holdYears: 3, sentence: "Stocks are held for 3 years, then sold automatically." },
    { holdYears: 5, sentence: "Stocks are held for 5 years, then sold automatically." },
    { holdYears: 10, sentence: "Stocks are held for 10 years, then sold automatically." },
    { holdYears: "indefinite", sentence: "Stocks are held until the game ends." },
  ];

  it.each(holdCases)("describes a $holdYears hold", ({ holdYears, sentence }) => {
    expect(describeConfig(configWith({ holdYears }))[4]).toBe(sentence);
  });

  const sellingCases = [
    { selling: "none", sentence: "You cannot sell a stock." },
    { selling: "any", sentence: "You can sell any stock at any time." },
    {
      selling: "sameIndustry",
      sentence: "You can sell a stock, but you have to replace it with one from the same industry that round.",
    },
  ];

  it.each(sellingCases)("describes $selling selling", ({ selling, sentence }) => {
    expect(describeConfig(configWith({ selling }))[5]).toBe(sentence);
  });

  const boardCases: [number, string, string][] = [
    [1, "onePerIndustry", "1 stock shown each round, each from a different industry."],
    [5, "onePerIndustry", "5 stocks shown each round, each from a different industry."],
    [8, "onePerIndustry", "8 stocks shown each round, each from a different industry."],
    [10, "onePerIndustry", "10 stocks shown each round, each from a different industry."],
    [1, "any", "1 stock shown each round, from any industry."],
    [5, "any", "5 stocks shown each round, from any industry."],
    [8, "any", "8 stocks shown each round, from any industry."],
    [10, "any", "10 stocks shown each round, from any industry."],
    [1, "sameIndustry", "1 stock shown each round, all from one industry."],
    [5, "sameIndustry", "5 stocks shown each round, all from one industry."],
    [8, "sameIndustry", "8 stocks shown each round, all from one industry."],
    [10, "sameIndustry", "10 stocks shown each round, all from one industry."],
  ];

  it.each(boardCases)(
    "describes %s stocks per round on a %s board",
    (stocksPerRound, boardDistribution, sentence) => {
      expect(describeConfig(configWith({ stocksPerRound, boardDistribution }))[1]).toBe(sentence);
    },
  );

  const allocationCases = [
    {
      title: "equal split",
      allocation: { kind: "equal" },
      sentence: "Your cash is split evenly across your remaining picks. With nothing sold, that's $1,250 per pick.",
    },
    {
      title: "a range",
      allocation: { kind: "range", min: 500, max: 3000 },
      sentence: "Each pick uses between $500 and $3,000.",
    },
    {
      title: "set amounts",
      allocation: { kind: "steps", percents: [10, 20, 30, 40, 50] },
      sentence: "Each pick uses one of these amounts: $1,000, $2,000, $3,000, $4,000, or $5,000.",
    },
    {
      title: "a minimum plus any amount",
      allocation: { kind: "minPlusFree", min: 500 },
      sentence: "Each pick uses at least $500, and you can spend any amount above that.",
    },
  ];

  it.each(allocationCases)("describes $title", ({ allocation, sentence }) => {
    expect(describeConfig(configWith({ allocation }))[3]).toBe(sentence);
  });

  it("rounds the equal split down to the cent", () => {
    const config = configWith({ rounds: 6 });

    expect(describeConfig(config)[3]).toBe(
      "Your cash is split evenly across your remaining picks. With nothing sold, that's $1,666.66 per pick.",
    );
  });

  it("describes invalid values without throwing", () => {
    const broken = configWith({
      rounds: "eight",
      stocksPerRound: 3,
      boardDistribution: null,
      pickDistribution: "all",
      allocation: null,
      holdYears: [],
      selling: "half",
    });

    expect(() => describeConfig(broken)).not.toThrow();
    expect(describeConfig(broken)).toEqual([
      "The number of rounds is not set.",
      "The board setup is not set.",
      "The pick rule is not set.",
      "The pick amounts are not set.",
      "The hold time is not set.",
      "The selling rule is not set.",
    ]);
  });
});
