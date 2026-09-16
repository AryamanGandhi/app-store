import { INDUSTRIES } from "@/lib/constants";
import { createRng, deriveSeed } from "@/lib/random";
import type { BoardEntry, GameState, Industry, Market, Stock } from "@/lib/types";

type Rng = ReturnType<typeof createRng>;

const SOLD_REASON = "You sold this stock this round.";

const ownedIndustryReason = (industry: Industry) => `You already own a ${industry} stock.`;

const replaceIndustryReason = (industry: Industry) => `Replace your ${industry} stock first.`;

const ownsIndustry = (state: GameState, industry: Industry) =>
  state.holdings.some((holding) => holding.industry === industry);

const isAvailable = (state: GameState, stock: Stock) =>
  !state.soldThisRound.includes(stock.ticker) && !state.holdings.some((holding) => holding.ticker === stock.ticker);

// The pickability rules the board draws from and the recompute helper both use.
const checkStock = (state: GameState, stock: Stock): { pickable: boolean; reason: string | null } => {
  if (state.soldThisRound.includes(stock.ticker)) {
    return { pickable: false, reason: SOLD_REASON };
  }

  if (state.mustReplaceIndustry !== null) {
    return stock.industry === state.mustReplaceIndustry
      ? { pickable: true, reason: null }
      : { pickable: false, reason: replaceIndustryReason(state.mustReplaceIndustry) };
  }

  if (state.config.pickDistribution === "onePerIndustry" && ownsIndustry(state, stock.industry)) {
    return { pickable: false, reason: ownedIndustryReason(stock.industry) };
  }

  return { pickable: true, reason: null };
};

const availableStocks = (state: GameState, market: Market) =>
  market.stocks.filter((stock) => isAvailable(state, stock));

// Industries that can still offer a stock this round.
const candidateIndustries = (state: GameState, market: Market): Industry[] => {
  const stocks = availableStocks(state, market);
  const industriesWithStock = INDUSTRIES.filter((industry) =>
    stocks.some((stock) => stock.industry === industry),
  );

  if (state.mustReplaceIndustry !== null) {
    return industriesWithStock.filter((industry) => industry === state.mustReplaceIndustry);
  }

  if (state.config.pickDistribution !== "onePerIndustry") {
    return industriesWithStock;
  }

  const unownedIndustries = industriesWithStock.filter((industry) => !ownsIndustry(state, industry));

  return unownedIndustries.length > 0 ? unownedIndustries : industriesWithStock;
};

const drawOnePerIndustry = (state: GameState, market: Market, rng: Rng): Stock[] => {
  const industries = rng.shuffle(candidateIndustries(state, market)).slice(0, state.config.stocksPerRound);

  return industries.flatMap((industry) => {
    const stocks = availableStocks(state, market).filter((stock) => stock.industry === industry);

    return stocks.length > 0 ? [rng.pick(stocks)] : [];
  });
};

const drawSameIndustry = (state: GameState, market: Market, rng: Rng): Stock[] => {
  const candidates = candidateIndustries(state, market);
  const industry = state.mustReplaceIndustry ?? (candidates.length > 0 ? rng.pick(candidates) : rng.pick(INDUSTRIES));
  const stocks = availableStocks(state, market).filter((stock) => stock.industry === industry);

  return rng.shuffle(stocks).slice(0, state.config.stocksPerRound);
};

// A board with nothing pickable would leave the player stuck, so one is swapped in when one exists.
const withPickableStock = (state: GameState, market: Market, drawn: Stock[], rng: Rng): Stock[] => {
  if (drawn.some((stock) => checkStock(state, stock).pickable)) {
    return drawn;
  }

  const pickable = availableStocks(state, market).filter((stock) => checkStock(state, stock).pickable);

  if (pickable.length === 0) {
    return drawn;
  }

  return [...drawn.slice(0, -1), rng.pick(pickable)];
};

const drawAnyIndustry = (state: GameState, market: Market, rng: Rng): Stock[] => {
  const drawn = rng.shuffle(availableStocks(state, market)).slice(0, state.config.stocksPerRound);

  return withPickableStock(state, market, drawn, rng);
};

const drawStocks = (state: GameState, market: Market, rng: Rng): Stock[] => {
  if (state.config.boardDistribution === "onePerIndustry") {
    return drawOnePerIndustry(state, market, rng);
  }

  if (state.config.boardDistribution === "sameIndustry") {
    return drawSameIndustry(state, market, rng);
  }

  return drawAnyIndustry(state, market, rng);
};

export function drawBoard(state: GameState, market: Market): BoardEntry[] {
  const rng = createRng(deriveSeed(state.seed, state.round));

  return drawStocks(state, market, rng).map((stock) => ({
    stock,
    price: market.prices[stock.ticker][state.year],
    ...checkStock(state, stock),
  }));
}

// Recomputes pickable and reason for a board that already exists, without changing its stocks.
export function recomputePickability(state: GameState, board: BoardEntry[]): BoardEntry[] {
  return board.map((entry) => {
    const { pickable, reason } = checkStock(state, entry.stock);

    return { ...entry, pickable, reason };
  });
}
