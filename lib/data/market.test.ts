import { describe, expect, it } from "vitest";
import { INDUSTRIES, MARKET_END_YEAR, MARKET_START_YEAR } from "@/lib/constants";
import { CRASH_YEAR, fakeMarket, generateMarket, getPrice, getStock, MARKET_SEED } from "@/lib/data/market";

const BLOCKLIST = [
  "AAPL",
  "MSFT",
  "GOOG",
  "GOOGL",
  "AMZN",
  "META",
  "NVDA",
  "TSLA",
  "NFLX",
  "INTC",
  "AMD",
  "IBM",
  "ORCL",
  "CSCO",
  "ADBE",
  "CRM",
  "JPM",
  "BAC",
  "WFC",
  "GS",
  "MS",
  "C",
  "V",
  "MA",
  "AXP",
  "XOM",
  "CVX",
  "COP",
  "JNJ",
  "PFE",
  "MRK",
  "UNH",
  "ABBV",
  "LLY",
  "WMT",
  "KO",
  "PEP",
  "PG",
  "COST",
  "MCD",
  "NKE",
  "SBUX",
  "HD",
  "DIS",
  "BA",
  "CAT",
  "GE",
  "MMM",
  "UPS",
  "FDX",
  "NEE",
  "DUK",
  "SO",
  "T",
  "VZ",
];

const years = Array.from({ length: MARKET_END_YEAR - MARKET_START_YEAR + 1 }, (_, index) => MARKET_START_YEAR + index);

const returnsForIndustryYear = (industry: (typeof INDUSTRIES)[number], year: number) => {
  const stocks = fakeMarket.stocks.filter((stock) => stock.industry === industry);

  return stocks.map((stock) => {
    const previous = fakeMarket.prices[stock.ticker][year - 1];
    const current = fakeMarket.prices[stock.ticker][year];
    return (current - previous) / previous;
  });
};

describe("fakeMarket structure", () => {
  it("has 80 stocks total, exactly 10 per industry, and valid metadata", () => {
    expect(fakeMarket.stocks).toHaveLength(80);
    expect(fakeMarket.startYear).toBe(2000);
    expect(fakeMarket.endYear).toBe(2024);

    for (const industry of INDUSTRIES) {
      expect(fakeMarket.stocks.filter((stock) => stock.industry === industry)).toHaveLength(10);
    }
  });

  it("uses only known industries with unique tickers and names", () => {
    const tickers = fakeMarket.stocks.map((stock) => stock.ticker);
    const names = fakeMarket.stocks.map((stock) => stock.name);

    expect(new Set(tickers).size).toBe(tickers.length);
    expect(new Set(names).size).toBe(names.length);

    for (const stock of fakeMarket.stocks) {
      expect(INDUSTRIES).toContain(stock.industry);
    }
  });

  it("uses 3 or 4 uppercase letters for every ticker and avoids the blocklist", () => {
    for (const stock of fakeMarket.stocks) {
      expect(stock.ticker).toMatch(/^[A-Z]{3,4}$/);
      expect(BLOCKLIST).not.toContain(stock.ticker);
    }
  });
});

describe("fakeMarket prices", () => {
  it("has a finite cent-rounded price for every stock in every year and no extra years", () => {
    for (const stock of fakeMarket.stocks) {
      const stockYears = Object.keys(fakeMarket.prices[stock.ticker]).map(Number).sort((left, right) => left - right);
      expect(stockYears).toEqual(years);

      for (const year of years) {
        const price = fakeMarket.prices[stock.ticker][year];

        expect(Number.isFinite(price)).toBe(true);
        expect(price).toBe(Math.round(price * 100) / 100);
        expect(price).toBeGreaterThanOrEqual(1);
        expect(price).toBeLessThanOrEqual(5000);
        expect(price).not.toBe(5000);
      }

      expect(fakeMarket.prices[stock.ticker][MARKET_START_YEAR]).toBeGreaterThanOrEqual(10);
      expect(fakeMarket.prices[stock.ticker][MARKET_START_YEAR]).toBeLessThanOrEqual(300);
    }
  });

  it("never repeats the exact same stored price in consecutive years", () => {
    for (const stock of fakeMarket.stocks) {
      for (let year = MARKET_START_YEAR + 1; year <= MARKET_END_YEAR; year += 1) {
        expect(fakeMarket.prices[stock.ticker][year]).not.toBe(fakeMarket.prices[stock.ticker][year - 1]);
      }
    }
  });
});

describe("market determinism", () => {
  it("returns identical data for the same seed and exposes the seeded market constant", () => {
    expect(generateMarket(MARKET_SEED)).toEqual(generateMarket(MARKET_SEED));
    expect(fakeMarket).toEqual(generateMarket(MARKET_SEED));
  });

  it("returns different prices for a different seed", () => {
    const alternate = generateMarket(MARKET_SEED + 1);

    expect(alternate.prices).not.toEqual(fakeMarket.prices);
  });
});

describe("game-feel checks", () => {
  it("shows a broad crash in the crash year and a broad recovery by crash year plus three", () => {
    const crashLosers = fakeMarket.stocks.filter(
      (stock) => fakeMarket.prices[stock.ticker][CRASH_YEAR] < fakeMarket.prices[stock.ticker][CRASH_YEAR - 1],
    ).length;
    const recoveryWinners = fakeMarket.stocks.filter(
      (stock) => fakeMarket.prices[stock.ticker][CRASH_YEAR + 3] > fakeMarket.prices[stock.ticker][CRASH_YEAR],
    ).length;

    expect(crashLosers).toBeGreaterThanOrEqual(60);
    expect(recoveryWinners).toBeGreaterThanOrEqual(48);
  });

  it("gives every industry at least one long-term winner and one long-term loser", () => {
    for (const industry of INDUSTRIES) {
      const stocks = fakeMarket.stocks.filter((stock) => stock.industry === industry);

      expect(
        stocks.some((stock) => fakeMarket.prices[stock.ticker][MARKET_END_YEAR] > fakeMarket.prices[stock.ticker][MARKET_START_YEAR]),
      ).toBe(true);
      expect(
        stocks.some((stock) => fakeMarket.prices[stock.ticker][MARKET_END_YEAR] < fakeMarket.prices[stock.ticker][MARKET_START_YEAR]),
      ).toBe(true);
    }
  });

  it("keeps the median 2024-to-2000 stock price ratio between 1.5x and 5x", () => {
    const ratios = fakeMarket.stocks
      .map((stock) => fakeMarket.prices[stock.ticker][MARKET_END_YEAR] / fakeMarket.prices[stock.ticker][MARKET_START_YEAR])
      .sort((left, right) => left - right);
    const medianRatio = (ratios[39] + ratios[40]) / 2;

    expect(medianRatio).toBeGreaterThanOrEqual(1.5);
    expect(medianRatio).toBeLessThanOrEqual(5);
  });

  it("has at least 20 percent of stocks finish below their starting price", () => {
    const endingBelowStart = fakeMarket.stocks.filter(
      (stock) => fakeMarket.prices[stock.ticker][MARKET_END_YEAR] < fakeMarket.prices[stock.ticker][MARKET_START_YEAR],
    ).length;

    expect(endingBelowStart).toBeGreaterThanOrEqual(16);
  });

  it("has at least 10 percent of stocks dip below 10 dollars in at least one year", () => {
    const subTenStocks = fakeMarket.stocks.filter((stock) =>
      years.some((year) => fakeMarket.prices[stock.ticker][year] < 10),
    ).length;

    expect(subTenStocks).toBeGreaterThanOrEqual(8);
  });

  it("keeps every stock below 25x its starting price by 2024", () => {
    for (const stock of fakeMarket.stocks) {
      const ratio = fakeMarket.prices[stock.ticker][MARKET_END_YEAR] / fakeMarket.prices[stock.ticker][MARKET_START_YEAR];
      expect(ratio).toBeLessThanOrEqual(25);
    }
  });

  it("has a crash-year median stock return of negative 20 percent or worse", () => {
    const crashReturns = fakeMarket.stocks
      .map((stock) => {
        const previous = fakeMarket.prices[stock.ticker][CRASH_YEAR - 1];
        const current = fakeMarket.prices[stock.ticker][CRASH_YEAR];
        return (current - previous) / previous;
      })
      .sort((left, right) => left - right);
    const medianReturn = (crashReturns[39] + crashReturns[40]) / 2;

    expect(medianReturn).toBeLessThanOrEqual(-0.2);
  });

  it("gives every industry at least one strong boom median year and one weak bust median year", () => {
    for (const industry of INDUSTRIES) {
      const medians = years.slice(1).map((year) => {
        const returns = returnsForIndustryYear(industry, year).sort((left, right) => left - right);
        return (returns[4] + returns[5]) / 2;
      });

      expect(medians.some((value) => value > 0.15)).toBe(true);
      expect(medians.some((value) => value < -0.1)).toBe(true);
    }
  });

  it("has at least 20 year-to-year changes where at least one industry is not all up or all down together", () => {
    const mixedDirectionYears = years.slice(1).filter((year) =>
      INDUSTRIES.some((industry) => {
        const returns = returnsForIndustryYear(industry, year);
        return returns.some((value) => value > 0) && returns.some((value) => value < 0);
      }),
    ).length;

    expect(mixedDirectionYears).toBeGreaterThanOrEqual(20);
  });
});

describe("market helpers", () => {
  it("getPrice returns the right value for a known ticker and year", () => {
    const stock = fakeMarket.stocks[0];
    expect(getPrice(stock.ticker, 2012)).toBe(fakeMarket.prices[stock.ticker][2012]);
  });

  it("getPrice throws for an unknown ticker and years outside the market range", () => {
    expect(() => getPrice("ZZZZ", 2012)).toThrow("Unknown ticker ZZZZ");
    expect(() => getPrice(fakeMarket.stocks[0].ticker, 1999)).toThrow("Unknown market year 1999");
    expect(() => getPrice(fakeMarket.stocks[0].ticker, 2025)).toThrow("Unknown market year 2025");
  });

  it("getStock returns a stock for a known ticker and undefined for an unknown one", () => {
    const stock = fakeMarket.stocks[1];

    expect(getStock(stock.ticker)).toEqual(stock);
    expect(getStock("ZZZZ")).toBeUndefined();
  });
});