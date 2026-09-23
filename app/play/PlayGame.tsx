"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GameOver } from "@/components/game/GameOver";
import { HoldingsPanel } from "@/components/game/HoldingsPanel";
import { ReplaceBanner } from "@/components/game/ReplaceBanner";
import { RoundHeader } from "@/components/game/RoundHeader";
import { StockBoard } from "@/components/game/StockBoard";
import { SpendPanel } from "@/components/game/spend/SpendPanel";
import { fakeMarket } from "@/lib/data/market";
import { canSell, createGameReducer, getHoldingValue, getSpendOptions, startGame } from "@/lib/engine";
import { randomSeed } from "@/lib/random";
import type { GameAction, GameConfig, GameState, Industry } from "@/lib/types";

type PlayGameProps = {
  config: GameConfig;
  modeName: string;
  accentColor: string;
};

export function PlayGame({ config, modeName, accentColor }: PlayGameProps) {
  const router = useRouter();
  const reducer = useMemo(() => createGameReducer(fakeMarket), []);
  const [state, setState] = useState<GameState | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [mobileHoldingsOpen, setMobileHoldingsOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Must create the seeded game only after mount to avoid server/client hydration mismatches.
    setState(startGame(config, fakeMarket, randomSeed()));
  }, [config]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Clear the previous pick whenever a new round starts or the game finishes.
    setSelectedTicker(null);
  }, [state?.round, state?.status]);

  const dispatch = (action: GameAction) => {
    setState((currentState) => {
      if (currentState === null) {
        return currentState;
      }

      return reducer(currentState, action);
    });
  };

  if (state === null) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-sm text-slate-600">Starting game...</p>
        </div>
      </main>
    );
  }

  const spendOptions = getSpendOptions(state);
  const selectedEntry = state.board.find((entry) => entry.stock.ticker === selectedTicker) ?? null;
  const holdingItems = state.holdings.map((holding) => ({
    holding,
    value: getHoldingValue(holding, fakeMarket, state.year),
    sellCheck: canSell(state, holding, fakeMarket),
  }));
  const finalHoldings = state.holdings.map((holding) => ({
    holding,
    finalValue: getHoldingValue(holding, fakeMarket, state.year),
  }));
  const sameIndustryBoard =
    config.boardDistribution === "sameIndustry" &&
    state.board.length > 0 &&
    state.board.every((entry) => entry.stock.industry === state.board[0].stock.industry);
  const roundIndustry: Industry | undefined = sameIndustryBoard ? state.board[0].stock.industry : undefined;
  const skipBlockedReason =
    state.mustReplaceIndustry === null ? null : `Replace your ${state.mustReplaceIndustry} stock first.`;
  const canSkip = skipBlockedReason === null;
  const showSpendPanel = state.status === "playing" && selectedEntry !== null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Back to store
            </Link>
            <button
              type="button"
              onClick={() => setMobileHoldingsOpen(true)}
              className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Your stocks ({state.holdings.length})
            </button>
          </div>

          <RoundHeader
            modeName={modeName}
            round={state.round}
            totalRounds={state.config.rounds}
            year={state.year}
            cash={state.cash}
            accentColor={accentColor}
            industry={roundIndustry}
          />

          {state.mustReplaceIndustry ? (
            <ReplaceBanner industry={state.mustReplaceIndustry} accentColor={accentColor} />
          ) : null}

          {state.status === "done" ? (
            <GameOver
              modeName={modeName}
              holdings={finalHoldings}
              cash={state.cash}
              accentColor={accentColor}
              onPlayAgain={() => dispatch({ type: "RESTART", seed: randomSeed() })}
              onBackToStore={() => router.push("/")}
            />
          ) : (
            <>
              <StockBoard
                entries={state.board}
                selectedTicker={selectedTicker}
                accentColor={accentColor}
                events={state.events}
                canSkip={canSkip}
                skipBlockedReason={skipBlockedReason}
                onSelect={setSelectedTicker}
                onSkip={() => dispatch({ type: "SKIP" })}
              />

              {showSpendPanel ? (
                <SpendPanel
                  options={spendOptions}
                  companyName={selectedEntry.stock.name}
                  startingBudget={state.config.startingBudget}
                  accentColor={accentColor}
                  onBuy={(amount) => {
                    dispatch({ type: "BUY", ticker: selectedEntry.stock.ticker, amount });
                    setSelectedTicker(null);
                  }}
                />
              ) : null}
            </>
          )}
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Your stocks</h2>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Back to store
            </Link>
          </div>
          <HoldingsPanel
            items={holdingItems}
            currentYear={state.year}
            holdYears={state.config.holdYears}
            sellingAllowed={state.config.selling !== "none"}
            accentColor={accentColor}
            onSell={(holdingId) => dispatch({ type: "SELL", holdingId })}
          />
        </aside>
      </div>

      {mobileHoldingsOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" aria-label="Your stocks sheet" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close your stocks"
            onClick={() => setMobileHoldingsOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div className="absolute right-0 bottom-0 left-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-slate-50 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Your stocks ({state.holdings.length})</h2>
              <button
                type="button"
                onClick={() => setMobileHoldingsOpen(false)}
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <HoldingsPanel
              items={holdingItems}
              currentYear={state.year}
              holdYears={state.config.holdYears}
              sellingAllowed={state.config.selling !== "none"}
              accentColor={accentColor}
              onSell={(holdingId) => dispatch({ type: "SELL", holdingId })}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}