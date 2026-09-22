"use client";

import { useState } from "react";

import { RoundHeader } from "@/components/game/RoundHeader";
import { StockBoard } from "@/components/game/StockBoard";
import {
  sampleStateBlocked,
  sampleStateMidGame,
  sampleStateReplace,
  sampleStateRound1,
  sampleStateSameIndustry,
} from "@/lib/fixtures";

const accentColor = "#2563eb";

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
    </main>
  );
}
