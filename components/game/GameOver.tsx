"use client";

import type { Holding } from "@/lib/types";

import { formatMoney, formatPercentChange } from "@/components/game/format";

export type FinalHolding = { holding: Holding; finalValue: number };

export type GameOverProps = {
  modeName: string;
  holdings: FinalHolding[];
  cash: number;
  accentColor: string;
  onPlayAgain: () => void;
  onBackToStore: () => void;
};

// Green when the stock finished up, red when it finished down, slate when it finished even.
const changeColorClass = (value: number, amountSpent: number) => {
  if (value > amountSpent) return "text-green-600";
  if (value < amountSpent) return "text-red-600";
  return "text-slate-600";
};

export function GameOver({
  modeName,
  holdings,
  cash,
  accentColor,
  onPlayAgain,
  onBackToStore,
}: GameOverProps) {
  return (
    <section
      aria-label="Game over"
      className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="h-2 w-full rounded-t-2xl" style={{ backgroundColor: accentColor }} />

      <div className="p-5">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Game over</h2>
        <p className="mt-1 text-sm text-slate-600">{modeName}</p>

        <ul aria-label="Final holdings" className="mt-4 space-y-3">
          {holdings.map(({ holding, finalValue }) => (
            <li key={holding.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900">{holding.name}</h3>
                  <span className="mt-0.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {holding.industry}
                  </span>
                  <p className="mt-2 text-sm text-slate-600">
                    Bought {holding.yearBought} for {formatMoney(holding.amountSpent)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-semibold text-slate-900">{formatMoney(finalValue)}</p>
                  <p className={`text-sm font-medium ${changeColorClass(finalValue, holding.amountSpent)}`}>
                    {formatPercentChange(finalValue, holding.amountSpent)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">Leftover cash</p>
          <p className="text-lg font-semibold text-slate-900">{formatMoney(cash)}</p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className="min-h-11 flex-1 rounded-2xl px-4 font-medium text-white"
            style={{ backgroundColor: accentColor }}
          >
            Play again
          </button>
          <button
            type="button"
            onClick={onBackToStore}
            className="min-h-11 flex-1 rounded-2xl border border-slate-200 px-4 font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to store
          </button>
        </div>
      </div>
    </section>
  );
}
