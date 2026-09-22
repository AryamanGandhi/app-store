"use client";

import { StockCard } from "./StockCard";
import type { BoardEntry, GameEvent } from "@/lib/types";

export type StockBoardProps = {
  entries: BoardEntry[];
  selectedTicker: string | null;
  accentColor: string;
  events: GameEvent[];
  canSkip: boolean;
  skipBlockedReason: string | null;
  onSelect: (ticker: string) => void;
  onSkip: () => void;
};

export function StockBoard({
  entries,
  selectedTicker,
  accentColor,
  events,
  canSkip,
  skipBlockedReason,
  onSelect,
  onSkip,
}: StockBoardProps) {
  // Hide the industry tag once a board has 2+ stocks that all match.
  // A single-card board (One Shot) keeps the tag.
  const allSameIndustry =
    entries.length >= 2 && entries.every((entry) => entry.stock.industry === entries[0].stock.industry);
  const hideIndustry = allSameIndustry;

  return (
    <section className="w-full">
      {events.length > 0 ? (
        <ul className="mb-3 space-y-1" aria-label="Round events">
          {events.map((event) => (
            <li key={event.id} className="text-sm text-slate-600">
              {event.message}
            </li>
          ))}
        </ul>
      ) : null}

      {entries.length === 1 ? (
        <div className="flex w-full justify-center">
          <div className="w-full max-w-md">
            <StockCard
              entry={entries[0]}
              selected={selectedTicker === entries[0].stock.ticker}
              accentColor={accentColor}
              hideIndustry={hideIndustry}
              onSelect={onSelect}
            />
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <li key={entry.stock.ticker}>
              <StockCard
                entry={entry}
                selected={selectedTicker === entry.stock.ticker}
                accentColor={accentColor}
                hideIndustry={hideIndustry}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onSkip}
          disabled={!canSkip}
          className="w-full min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Skip round
        </button>
        {!canSkip && skipBlockedReason ? (
          <span className="text-sm text-slate-500">{skipBlockedReason}</span>
        ) : null}
      </div>
    </section>
  );
}
