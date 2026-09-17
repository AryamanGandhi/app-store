import { INDUSTRIES, MARKET_END_YEAR, MARKET_START_YEAR } from "@/lib/constants";
import { createRng } from "@/lib/random";
import type { Industry, Market, Stock } from "@/lib/types";

export const MARKET_SEED = 20240917;
export const CRASH_YEAR = 2008;

type Personality = "steady" | "fast" | "volatile" | "decliner";

type CompanyDefinition = Stock & {
  personality: Personality;
};

type PersonalityProfile = {
  driftMin: number;
  driftMax: number;
  noiseMin: number;
  noiseMax: number;
};

type CompanyTraits = {
  drift: number;
  noiseLevel: number;
  startPrice: number;
};

const PERSONALITY_PROFILES: Record<Personality, PersonalityProfile> = {
  steady: { driftMin: 0.02, driftMax: 0.05, noiseMin: 0.02, noiseMax: 0.05 },
  fast: { driftMin: 0.06, driftMax: 0.1, noiseMin: 0.08, noiseMax: 0.13 },
  volatile: { driftMin: -0.025, driftMax: 0.025, noiseMin: 0.2, noiseMax: 0.3 },
  decliner: { driftMin: -0.11, driftMax: -0.07, noiseMin: 0.05, noiseMax: 0.09 },
};

const COMPANY_DEFINITIONS: CompanyDefinition[] = [
  { ticker: "BWVS", name: "Brightwave Systems", industry: "Technology", personality: "steady" },
  { ticker: "QLNX", name: "Quillnex Logic", industry: "Technology", personality: "steady" },
  { ticker: "AERO", name: "Aetherroot Devices", industry: "Technology", personality: "steady" },
  { ticker: "VYNT", name: "Vyntra Labs", industry: "Technology", personality: "fast" },
  { ticker: "SKYA", name: "Skyarc Compute", industry: "Technology", personality: "fast" },
  { ticker: "NRVO", name: "Nerva Grid", industry: "Technology", personality: "volatile" },
  { ticker: "PXLM", name: "Pixelmantle Works", industry: "Technology", personality: "volatile" },
  { ticker: "TRFX", name: "Terraflex Circuits", industry: "Technology", personality: "volatile" },
  { ticker: "MRTL", name: "Morrowtel Instruments", industry: "Technology", personality: "decliner" },
  { ticker: "DNRY", name: "Datarin Relay", industry: "Technology", personality: "decliner" },

  { ticker: "CLVM", name: "Clovermere Biologics", industry: "Healthcare", personality: "steady" },
  { ticker: "VLNS", name: "Valence Care", industry: "Healthcare", personality: "steady" },
  { ticker: "MRDN", name: "Meridian Therapeutics", industry: "Healthcare", personality: "steady" },
  { ticker: "ONVA", name: "Onvanta Genomics", industry: "Healthcare", personality: "fast" },
  { ticker: "HYNX", name: "Hylenix Medical", industry: "Healthcare", personality: "fast" },
  { ticker: "PRSM", name: "Prismara Health", industry: "Healthcare", personality: "volatile" },
  { ticker: "ALVO", name: "Alvoro Trials", industry: "Healthcare", personality: "volatile" },
  { ticker: "CYTA", name: "Cytara Labs", industry: "Healthcare", personality: "volatile" },
  { ticker: "BRLN", name: "Briarline Wellness", industry: "Healthcare", personality: "decliner" },
  { ticker: "NOMA", name: "Nomaris Devices", industry: "Healthcare", personality: "decliner" },

  { ticker: "HBRC", name: "Harborcrest Capital", industry: "Financials", personality: "steady" },
  { ticker: "PGLD", name: "Pineglade Finance", industry: "Financials", personality: "steady" },
  { ticker: "TRST", name: "Trustera Holdings", industry: "Financials", personality: "steady" },
  { ticker: "LMQT", name: "Lumiquant Markets", industry: "Financials", personality: "fast" },
  { ticker: "RVLT", name: "Rivolt Payments", industry: "Financials", personality: "fast" },
  { ticker: "SPNR", name: "Spanrail Credit", industry: "Financials", personality: "volatile" },
  { ticker: "KYFD", name: "Keyfield Underwriting", industry: "Financials", personality: "volatile" },
  { ticker: "ORBN", name: "Orbinet Leasing", industry: "Financials", personality: "volatile" },
  { ticker: "FARM", name: "Fairmont Ledger", industry: "Financials", personality: "decliner" },
  { ticker: "DLSH", name: "Daleshore Savings", industry: "Financials", personality: "decliner" },

  { ticker: "HLPN", name: "Helion Peak Resources", industry: "Energy", personality: "steady" },
  { ticker: "CRVA", name: "Carvane Fuel", industry: "Energy", personality: "steady" },
  { ticker: "TDLG", name: "Tidelight Drilling", industry: "Energy", personality: "steady" },
  { ticker: "SVLT", name: "Sunvolt Materials", industry: "Energy", personality: "fast" },
  { ticker: "RNVA", name: "Renova Basin", industry: "Energy", personality: "fast" },
  { ticker: "QBRN", name: "Quarryburn Gas", industry: "Energy", personality: "volatile" },
  { ticker: "MTRX", name: "Matrix Extraction", industry: "Energy", personality: "volatile" },
  { ticker: "ORCA", name: "Orcaflare Services", industry: "Energy", personality: "volatile" },
  { ticker: "BLHM", name: "Blackhammock Coal", industry: "Energy", personality: "decliner" },
  { ticker: "ASHN", name: "Ashen Ridge Powerfuels", industry: "Energy", personality: "decliner" },

  { ticker: "GLNT", name: "Gallant Thread", industry: "Consumer Discretionary", personality: "steady" },
  { ticker: "MRVL", name: "Marvelle Living", industry: "Consumer Discretionary", personality: "steady" },
  { ticker: "ROVA", name: "Rovale Home", industry: "Consumer Discretionary", personality: "steady" },
  { ticker: "LUMO", name: "Lumora Style", industry: "Consumer Discretionary", personality: "fast" },
  { ticker: "FYRA", name: "Fyrra Leisure", industry: "Consumer Discretionary", personality: "fast" },
  { ticker: "SKIP", name: "Skipperline Toys", industry: "Consumer Discretionary", personality: "volatile" },
  { ticker: "MNTA", name: "Montara Apparel", industry: "Consumer Discretionary", personality: "volatile" },
  { ticker: "VNTO", name: "Ventori Retail", industry: "Consumer Discretionary", personality: "volatile" },
  { ticker: "OLDN", name: "Olden Lane Furnishings", industry: "Consumer Discretionary", personality: "decliner" },
  { ticker: "BRKT", name: "Brickettle Stores", industry: "Consumer Discretionary", personality: "decliner" },

  { ticker: "PANR", name: "Pantrio Foods", industry: "Consumer Staples", personality: "steady" },
  { ticker: "MLGR", name: "Millgrove Pantry", industry: "Consumer Staples", personality: "steady" },
  { ticker: "SNDA", name: "Sundale Household", industry: "Consumer Staples", personality: "steady" },
  { ticker: "FRSH", name: "Freshara Brands", industry: "Consumer Staples", personality: "fast" },
  { ticker: "NMRA", name: "Nimora Nutrition", industry: "Consumer Staples", personality: "fast" },
  { ticker: "CSPR", name: "Crispery Goods", industry: "Consumer Staples", personality: "volatile" },
  { ticker: "BRVL", name: "Bravel Soapworks", industry: "Consumer Staples", personality: "volatile" },
  { ticker: "THMP", name: "Thimble Packaged Meals", industry: "Consumer Staples", personality: "volatile" },
  { ticker: "STND", name: "Stoneford Canning", industry: "Consumer Staples", personality: "decliner" },
  { ticker: "PLMB", name: "Plumbrook Paper Goods", industry: "Consumer Staples", personality: "decliner" },

  { ticker: "IRNX", name: "Ironex Fabrication", industry: "Industrials", personality: "steady" },
  { ticker: "CRWN", name: "Crownyard Transit", industry: "Industrials", personality: "steady" },
  { ticker: "VSLA", name: "Vastline Machines", industry: "Industrials", personality: "steady" },
  { ticker: "DLTA", name: "Deltara Motion", industry: "Industrials", personality: "fast" },
  { ticker: "RYTH", name: "Rythor Aerospace", industry: "Industrials", personality: "fast" },
  { ticker: "FLXN", name: "Flexon Craneworks", industry: "Industrials", personality: "volatile" },
  { ticker: "ORYT", name: "Oryth Freight", industry: "Industrials", personality: "volatile" },
  { ticker: "KRVA", name: "Kerva Components", industry: "Industrials", personality: "volatile" },
  { ticker: "HMST", name: "Hemstead Rail", industry: "Industrials", personality: "decliner" },
  { ticker: "BLGT", name: "Boltgate Engines", industry: "Industrials", personality: "decliner" },

  { ticker: "HBLN", name: "Harborline Power", industry: "Utilities", personality: "steady" },
  { ticker: "CLRS", name: "Clearspan Water", industry: "Utilities", personality: "steady" },
  { ticker: "GRDG", name: "Gridgard Transmission", industry: "Utilities", personality: "steady" },
  { ticker: "SVRA", name: "Sovara Renewables", industry: "Utilities", personality: "fast" },
  { ticker: "LMNA", name: "Lumena Storage", industry: "Utilities", personality: "fast" },
  { ticker: "TRID", name: "Tiderest Utility Works", industry: "Utilities", personality: "volatile" },
  { ticker: "VALT", name: "Valtor Grid Services", industry: "Utilities", personality: "volatile" },
  { ticker: "RSHM", name: "Rushmere Hydro", industry: "Utilities", personality: "volatile" },
  { ticker: "BRNT", name: "Burntide Gaslight", industry: "Utilities", personality: "decliner" },
  { ticker: "ELMW", name: "Elmwatch Steam", industry: "Utilities", personality: "decliner" },
];

const YEARS = Array.from({ length: MARKET_END_YEAR - MARKET_START_YEAR + 1 }, (_, index) => MARKET_START_YEAR + index);
const NON_EVENT_YEARS = YEARS.filter((year) => year !== MARKET_START_YEAR);
const INDUSTRY_EVENT_ELIGIBLE_YEARS = NON_EVENT_YEARS.filter((year) => year < CRASH_YEAR || year > CRASH_YEAR + 2);

const stockLookup = new Map(
  COMPANY_DEFINITIONS.map((company) => [
    company.ticker,
    { ticker: company.ticker, name: company.name, industry: company.industry },
  ]),
);

const roundToCents = (value: number) => Math.round(value * 100) / 100;

const randomBetween = (min: number, max: number, next: number) => min + (max - min) * next;

const buildUniqueYearSet = (
  rng: ReturnType<typeof createRng>,
  count: number,
  excluded: ReadonlySet<number>,
) => {
  const years = new Set<number>();

  while (years.size < count) {
    const year = rng.pick(INDUSTRY_EVENT_ELIGIBLE_YEARS.filter((candidate) => !excluded.has(candidate) && !years.has(candidate)));
    years.add(year);
  }

  return years;
};

export function generateMarket(seed: number): Market {
  const rng = createRng(seed);
  const stocks: Stock[] = COMPANY_DEFINITIONS.map((company) => ({
    ticker: company.ticker,
    name: company.name,
    industry: company.industry,
  }));

  const companyTraits = new Map<string, CompanyTraits>(
    COMPANY_DEFINITIONS.map((company) => {
      const profile = PERSONALITY_PROFILES[company.personality];
      return [
        company.ticker,
        {
          drift: randomBetween(profile.driftMin, profile.driftMax, rng.next()),
          noiseLevel: randomBetween(profile.noiseMin, profile.noiseMax, rng.next()),
          startPrice: roundToCents(randomBetween(10, 220, rng.next())),
        },
      ] as const;
    }),
  );

  const industryReturns = new Map<Industry, Record<number, number>>();

  for (const industry of INDUSTRIES) {
    const boomCount = rng.int(2, 3);
    const bustCount = rng.int(2, 3);
    const boomYears = buildUniqueYearSet(rng, boomCount, new Set());
    const bustYears = buildUniqueYearSet(rng, bustCount, boomYears);
    const yearlyReturns: Record<number, number> = {};

    for (const year of NON_EVENT_YEARS) {
      if (boomYears.has(year)) {
        yearlyReturns[year] = randomBetween(0.12, 0.22, rng.next());
      } else if (bustYears.has(year)) {
        yearlyReturns[year] = randomBetween(-0.22, -0.12, rng.next());
      } else {
        yearlyReturns[year] = randomBetween(-0.06, 0.07, rng.next());
      }
    }

    industryReturns.set(industry, yearlyReturns);
  }

  const marketReturns: Record<number, number> = {};

  for (const year of NON_EVENT_YEARS) {
    if (year === CRASH_YEAR) {
      marketReturns[year] = randomBetween(-0.45, -0.3, rng.next());
    } else if (year <= CRASH_YEAR + 3) {
      marketReturns[year] = randomBetween(0.06, 0.14, rng.next());
    } else {
      marketReturns[year] = randomBetween(-0.04, 0.05, rng.next());
    }
  }

  const generatedPrices = Object.fromEntries(
    stocks.map((stock) => {
      const traits = companyTraits.get(stock.ticker);

      if (traits === undefined) {
        throw new Error(`Missing traits for ticker ${stock.ticker}`);
      }

      let runningPrice = traits.startPrice;
      const yearlyPrices: Record<number, number> = {
        [MARKET_START_YEAR]: runningPrice,
      };

      for (const year of NON_EVENT_YEARS) {
        const industryYearlyReturns = industryReturns.get(stock.industry);

        if (industryYearlyReturns === undefined) {
          throw new Error(`Missing industry returns for ${stock.industry}`);
        }

        const companyNoise = randomBetween(-traits.noiseLevel, traits.noiseLevel, rng.next());
        const appliedDrift = year === CRASH_YEAR ? traits.drift * 0.5 : traits.drift;
        const totalReturn = Math.max(
          -0.6,
          Math.min(0.8, marketReturns[year] + industryYearlyReturns[year] + appliedDrift + companyNoise),
        );

        runningPrice = Math.min(5000, Math.max(1, runningPrice * (1 + totalReturn)));
        let storedPrice = roundToCents(runningPrice);
        const previousStoredPrice = yearlyPrices[year - 1];

        if (storedPrice === previousStoredPrice) {
          const nudgedPrice = totalReturn >= 0 ? storedPrice + 0.01 : storedPrice - 0.01;
          storedPrice = Math.min(4999.99, Math.max(1, roundToCents(nudgedPrice)));
          runningPrice = storedPrice;
        }

        yearlyPrices[year] = storedPrice;
      }

      return [stock.ticker, yearlyPrices];
    }),
  ) as Record<string, Record<number, number>>;

  return {
    stocks,
    startYear: MARKET_START_YEAR,
    endYear: MARKET_END_YEAR,
    prices: generatedPrices,
  };
}

export const fakeMarket: Market = generateMarket(MARKET_SEED);

export function getPrice(ticker: string, year: number): number {
  if (year < fakeMarket.startYear || year > fakeMarket.endYear) {
    throw new Error(
      `Unknown market year ${year}. Expected a year between ${fakeMarket.startYear} and ${fakeMarket.endYear}.`,
    );
  }

  const stockPrices = fakeMarket.prices[ticker];

  if (stockPrices === undefined) {
    throw new Error(`Unknown ticker ${ticker}`);
  }

  return stockPrices[year];
}

export function getStock(ticker: string): Stock | undefined {
  return stockLookup.get(ticker);
}