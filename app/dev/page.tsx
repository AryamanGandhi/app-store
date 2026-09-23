"use client";

import { useState } from "react";

import { GameOver } from "@/components/game/GameOver";
import type { FinalHolding } from "@/components/game/GameOver";
import { HoldingsPanel } from "@/components/game/HoldingsPanel";
import type { HoldingItem } from "@/components/game/HoldingsPanel";
import { ReplaceBanner } from "@/components/game/ReplaceBanner";
import { RoundHeader } from "@/components/game/RoundHeader";
import { StockBoard } from "@/components/game/StockBoard";
import { formatMoney } from "@/components/game/format";
import { SpendPanel } from "@/components/game/spend/SpendPanel";
import {
  sampleMarket,
  sampleStateBlocked,
  sampleStateGameOver,
  sampleStateMidGame,
  sampleStateReplace,
  sampleStateRound1,
  sampleStateSameIndustry,
  sampleSpendBlocked,
  sampleSpendEqual,
  sampleSpendMinPlusFree,
  sampleSpendRange,
  sampleSpendSteps,
} from "@/lib/fixtures";

const accentColor = "#2563eb";

// Current value of a holding is shares times this year's price, rounded to cents.
const valueAt = (ticker: string, shares: number, year: number) =>
  Math.round(shares * sampleMarket.prices[ticker][year] * 100) / 100;

const midGameItems: HoldingItem[] = sampleStateMidGame.holdings.map((holding) => ({
  holding,
  value: valueAt(holding.ticker, holding.shares, sampleStateMidGame.year),
  sellCheck: { allowed: true, reason: null },
}));

// The second row stands in for a round where only one sale is allowed.
const blockedItems: HoldingItem[] = midGameItems.map((item, index) =>
  index === 1
    ? { ...item, sellCheck: { allowed: false, reason: "You can only sell one stock per round." } }
    : item,
);

const gameOverHoldings: FinalHolding[] = sampleStateGameOver.holdings.map((holding) => ({
  holding,
  finalValue: valueAt(holding.ticker, holding.shares, sampleStateGameOver.year),
}));


export default function DevPage() {
  const [lastAction, setLastAction] = useState("No action yet.");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const handleSelect = (ticker: string) => {
    setSelectedTicker(ticker);
    setLastAction(`Selected ${ticker}`);
  };
  const handleSkip = () => {
    setLastAction("Skip tapped");
  };
  const handleBuy = (amount: number) => {
    setLastAction(`Buy ${formatMoney(amount)} of Quantara Systems`);
  };
  const handleSell = (holdingId: string) => {
    setLastAction(`Sell ${holdingId}`);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
        Last action: {lastAction}
      </div>

      <h2 className="mb-2 text-lg font-semibold text-slate-900">RoundHeader</h2>
      <RoundHeader
        modeName="Classic Draft"
        round={1}
        totalRounds={8}
        year={2002}
        cash={10000}
        accentColor={accentColor}
      />
      <RoundHeader
        modeName="Sector Focus"
        round={2}
        totalRounds={8}
        year={2003}
        cash={8750}
        accentColor={accentColor}
        industry="Consumer Discretionary"
      />

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">StockBoard — 1 stock</h2>
      <StockBoard
        entries={sampleStateRound1.board.slice(0, 1)}
        selectedTicker={selectedTicker}
        accentColor={accentColor}
        events={[]}
        canSkip
        skipBlockedReason={null}
        onSelect={handleSelect}
        onSkip={handleSkip}
      />

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">StockBoard — 5 stocks</h2>
      <StockBoard
        entries={sampleStateRound1.board}
        selectedTicker={selectedTicker}
        accentColor={accentColor}
        events={[]}
        canSkip
        skipBlockedReason={null}
        onSelect={handleSelect}
        onSkip={handleSkip}
      />

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">StockBoard — 10 stocks</h2>
      <StockBoard
        entries={sampleStateMidGame.board}
        selectedTicker={selectedTicker}
        accentColor={accentColor}
        events={sampleStateMidGame.events}
        canSkip
        skipBlockedReason={null}
        onSelect={handleSelect}
        onSkip={handleSkip}
      />

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">StockBoard — same industry</h2>
      <StockBoard
        entries={sampleStateSameIndustry.board}
        selectedTicker={selectedTicker}
        accentColor={accentColor}
        events={[]}
        canSkip
        skipBlockedReason={null}
        onSelect={handleSelect}
        onSkip={handleSkip}
      />

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">StockBoard — blocked cards</h2>
      <StockBoard
        entries={sampleStateBlocked.board}
        selectedTicker={selectedTicker}
        accentColor={accentColor}
        events={[]}
        canSkip
        skipBlockedReason={null}
        onSelect={handleSelect}
        onSkip={handleSkip}
      />

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">
        StockBoard — events and skip blocked
      </h2>
      <StockBoard
        entries={sampleStateReplace.board}
        selectedTicker={selectedTicker}
        accentColor={accentColor}
        events={sampleStateReplace.events}
        canSkip={false}
        skipBlockedReason="Replace your Energy stock first."
        onSelect={handleSelect}
        onSkip={handleSkip}
      />

      <h2 className="mb-2 mt-8 text-lg font-semibold text-slate-900">SpendPanel</h2>
      <p className="mb-4 text-sm text-slate-600">
        Five spend controls, each wired to the Last action line above.
      </p>

      <div className="mb-6 space-y-8">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Equal</h3>
          <SpendPanel
            options={sampleSpendEqual}
            companyName="Quantara Systems"
            startingBudget={10000}
            accentColor={accentColor}
            sticky={false}
            onBuy={handleBuy}
          />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Range</h3>
          <SpendPanel
            options={sampleSpendRange}
            companyName="Quantara Systems"
            startingBudget={10000}
            accentColor={accentColor}
            sticky={false}
            onBuy={handleBuy}
          />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Steps</h3>
          <SpendPanel
            options={sampleSpendSteps}
            companyName="Quantara Systems"
            startingBudget={10000}
            accentColor={accentColor}
            sticky={false}
            onBuy={handleBuy}
          />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Min + Free</h3>
          <SpendPanel
            options={sampleSpendMinPlusFree}
            companyName="Quantara Systems"
            startingBudget={10000}
            accentColor={accentColor}
            sticky={false}
            onBuy={handleBuy}
          />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Blocked (cannot buy)</h3>
          <SpendPanel
            options={sampleSpendBlocked}
            companyName="Quantara Systems"
            startingBudget={10000}
            accentColor={accentColor}
            sticky={false}
            onBuy={handleBuy}
          />
        </div>
      </div>
      <h2 className="mb-2 mt-8 text-lg font-semibold text-slate-900">HoldingsPanel</h2>
      <p className="mb-4 text-sm text-slate-600">
        Three holdings from the 2005 state. Tap Sell to open the confirmation on that row. The 2002
        row reads 0 years because this fixture keeps a holding the engine would already have sold
        at the start of 2005, so real states always show at least one year.
      </p>

      <h3 className="mb-2 text-sm font-semibold text-slate-700">Narrow container (max-w-sm)</h3>
      <div className="max-w-sm">
        <HoldingsPanel
          items={midGameItems}
          currentYear={sampleStateMidGame.year}
          holdYears={sampleStateMidGame.config.holdYears}
          sellingAllowed={true}
          accentColor={accentColor}
          onSell={handleSell}
        />
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">
        Wide, no fixed width of its own
      </h3>
      <HoldingsPanel
        items={midGameItems}
        currentYear={sampleStateMidGame.year}
        holdYears={sampleStateMidGame.config.holdYears}
        sellingAllowed={true}
        accentColor={accentColor}
        onSell={handleSell}
      />

      <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">
        Indefinite hold
      </h3>
      <div className="max-w-sm">
        <HoldingsPanel
          items={midGameItems}
          currentYear={sampleStateMidGame.year}
          holdYears="indefinite"
          sellingAllowed={true}
          accentColor={accentColor}
          onSell={handleSell}
        />
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">
        One Sell button blocked
      </h3>
      <HoldingsPanel
        items={blockedItems}
        currentYear={sampleStateMidGame.year}
        holdYears={sampleStateMidGame.config.holdYears}
        sellingAllowed={true}
        accentColor={accentColor}
        onSell={handleSell}
      />

      <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Selling turned off</h3>
      <div className="max-w-sm">
        <HoldingsPanel
          items={midGameItems}
          currentYear={sampleStateMidGame.year}
          holdYears={sampleStateMidGame.config.holdYears}
          sellingAllowed={false}
          accentColor={accentColor}
          onSell={handleSell}
        />
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Empty</h3>
      <div className="max-w-sm">
        <HoldingsPanel
          items={[]}
          currentYear={sampleStateMidGame.year}
          holdYears={sampleStateMidGame.config.holdYears}
          sellingAllowed={true}
          accentColor={accentColor}
          onSell={handleSell}
        />
      </div>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-slate-900">ReplaceBanner</h2>
      <ReplaceBanner
        industry={sampleStateReplace.mustReplaceIndustry!}
        accentColor={accentColor}
      />

      <h2 className="mb-2 mt-8 text-lg font-semibold text-slate-900">GameOver</h2>
      <p className="mb-4 text-sm text-slate-600">
        Final values use the 2009 prices from the sample market.
      </p>
      <GameOver
        modeName="Classic Draft"
        holdings={gameOverHoldings}
        cash={sampleStateGameOver.cash}
        accentColor={accentColor}
        onPlayAgain={() => setLastAction("Play again tapped")}
        onBackToStore={() => setLastAction("Back to store tapped")}
      />
    </main>
  );
}
