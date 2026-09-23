"use client";

import { useState } from "react";

import type { HoldYears, Holding, SellCheck } from "@/lib/types";

import { formatMoney, formatPercentChange } from "@/components/game/format";

export type HoldingItem = { holding: Holding; value: number; sellCheck: SellCheck };

export type HoldingsPanelProps = {
  items: HoldingItem[];
  currentYear: number;
  holdYears: HoldYears;
  sellingAllowed: boolean;
  accentColor: string;
  onSell: (holdingId: string) => void;
};

// Green when the stock is up, red when it is down, slate when it is exactly even.
const changeColorClass = (value: number, amountSpent: number) => {
  if (value > amountSpent) return "text-green-600";
  if (value < amountSpent) return "text-red-600";
  return "text-slate-600";
};

const holdStatusLabel = (holding: Holding, currentYear: number, holdYears: HoldYears) => {
  if (holdYears === "indefinite") return "Held until end";

  const yearsLeft = holding.yearBought + holdYears - currentYear;
  return yearsLeft === 1 ? "Sells in 1 year" : `Sells in ${yearsLeft} years`;
};

export function HoldingsPanel({
  items,
  currentYear,
  holdYears,
  sellingAllowed,
  accentColor,
  onSell,
}: HoldingsPanelProps) {
  // Only one row can be waiting for confirmation at a time.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <section
        aria-label="Your stocks"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <p className="text-sm text-slate-600">
          No stocks yet. Pick one from the board to get started.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Your stocks" className="space-y-3">
      <ul className="space-y-3">
        {items.map((item) => {
          const { holding, value, sellCheck } = item;
          const confirming = confirmingId === holding.id;

          return (
            <li
              key={holding.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900">{holding.name}</h3>
                  <span className="mt-0.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {holding.industry}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-semibold text-slate-900">{formatMoney(value)}</p>
                  <p
                    className={`text-sm font-medium ${changeColorClass(value, holding.amountSpent)}`}
                  >
                    {formatPercentChange(value, holding.amountSpent)}
                  </p>
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                Bought {holding.yearBought} for {formatMoney(holding.amountSpent)}
              </p>
              <p className="text-sm text-slate-600">
                {holdStatusLabel(holding, currentYear, holdYears)}
              </p>

              {sellingAllowed ? (
                <div className="mt-3">
                  {sellCheck.allowed ? (
                    confirming ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-700">
                          Sell for {formatMoney(value)}?
                        </p>
                        <button
                          type="button"
                          onClick={() => onSell(holding.id)}
                          className="min-h-11 rounded-xl px-4 text-sm font-medium text-white"
                          style={{ backgroundColor: accentColor }}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(holding.id)}
                        aria-label={`Sell ${holding.name}`}
                        className="min-h-11 rounded-xl border-2 px-4 text-sm font-medium text-slate-900 hover:bg-slate-50"
                        style={{ borderColor: accentColor }}
                      >
                        Sell
                      </button>
                    )
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled
                        aria-label={`Sell ${holding.name}`}
                        className="min-h-11 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-400"
                      >
                        Sell
                      </button>
                      {sellCheck.reason ? (
                        <p className="text-sm text-slate-500">{sellCheck.reason}</p>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
