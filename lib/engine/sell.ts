import { getHoldingValue } from "@/lib/engine/game";
import { getSpendOptions } from "@/lib/engine/spend";
import type { GameState, Holding, Market, SellCheck } from "@/lib/types";

export function canSell(state: GameState, holding: Holding, market: Market): SellCheck {
  if (state.config.selling === "none") {
    return { allowed: false, reason: "This mode doesn't allow selling." };
  }

  if (state.status === "done") {
    return { allowed: false, reason: "The game is over." };
  }

  const ownedHolding = state.holdings.find((candidate) => candidate.id === holding.id);
  if (!ownedHolding) {
    return { allowed: false, reason: "You no longer own this stock." };
  }

  if (state.mustReplaceIndustry !== null) {
    return { allowed: false, reason: `Replace your ${state.mustReplaceIndustry} stock first.` };
  }

  if (state.config.selling === "sameIndustry") {
    if (state.soldThisRound.length > 0) {
      return { allowed: false, reason: "You can only sell one stock per round." };
    }

    // Without a replacement to buy the player could neither buy nor skip, so the round would stall.
    const replacementExists = market.stocks.some((stock) =>
      stock.industry === ownedHolding.industry &&
      stock.ticker !== ownedHolding.ticker &&
      !state.holdings.some((owned) => owned.ticker === stock.ticker) &&
      !state.soldThisRound.includes(stock.ticker),
    );

    if (!replacementExists) {
      return { allowed: false, reason: `There are no other ${ownedHolding.industry} stocks left to buy.` };
    }

    const value = getHoldingValue(ownedHolding, market, state.year);
    const afterSale: GameState = {
      ...state,
      cash: Math.round((state.cash + value) * 100) / 100,
      holdings: state.holdings.filter((candidate) => candidate.id !== ownedHolding.id),
      soldThisRound: [...state.soldThisRound, ownedHolding.ticker],
      mustReplaceIndustry: ownedHolding.industry,
    };

    if (!getSpendOptions(afterSale).canBuy) {
      return { allowed: false, reason: "You wouldn't have enough cash to buy a replacement." };
    }
  }

  return { allowed: true, reason: null };
}
