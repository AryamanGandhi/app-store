"use client";

import { useEffect, useState } from "react";

import type { SpendOptions } from "@/lib/types";

import { formatMoney } from "@/components/game/format";

export type MinPlusFreeSpendProps = {
  options: SpendOptions;
  startingBudget: number;
  accentColor: string;
  onAmountChange: (amount: number, valid: boolean) => void;
};

const roundToCents = (value: number) => Math.round(value * 100) / 100;

export function MinPlusFreeSpend({
  options,
  startingBudget,
  accentColor,
  onAmountChange,
}: MinPlusFreeSpendProps) {
  const [mode, setMode] = useState<"$" | "%">("$");
  const [input, setInput] = useState("");

  const numeric = Number(input);
  const hasValue = input.trim() !== "" && !Number.isNaN(numeric);
  const inDollars = mode === "$";
  const amount = inDollars ? numeric : roundToCents((numeric / 100) * startingBudget);

  const valid = hasValue && amount >= options.min && amount <= options.max;

  useEffect(() => {
    onAmountChange(hasValue ? amount : 0, valid);
  }, [input, mode, amount, valid, hasValue, options.min, options.max, onAmountChange]);

  const belowMin = hasValue && amount < options.min;
  const aboveMax = hasValue && amount > options.max;
  const errorText = belowMin
    ? `The minimum is ${formatMoney(options.min)}.`
    : aboveMax
      ? `The most you can spend is ${formatMoney(options.max)}.`
      : null;

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex">
          <button
            type="button"
            onClick={() => setMode("$")}
            aria-pressed={inDollars}
            className={
              "min-h-11 rounded-l-xl border border-slate-200 px-3 text-slate-700 " +
              (inDollars ? "text-white" : "bg-slate-50 hover:bg-slate-100")
            }
            style={inDollars ? { backgroundColor: accentColor } : undefined}
          >
            $
          </button>
          <button
            type="button"
            onClick={() => setMode("%")}
            aria-pressed={!inDollars}
            className={
              "min-h-11 rounded-r-xl border border-slate-200 px-3 text-slate-700 " +
              (!inDollars ? "text-white" : "bg-slate-50 hover:bg-slate-100")
            }
            style={!inDollars ? { backgroundColor: accentColor } : undefined}
          >
            %
          </button>
        </div>
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label={inDollars ? "Dollar amount" : "Percent of budget"}
          className="min-h-11 w-full min-w-[120px] rounded-xl border border-slate-200 px-3 py-2 text-xl text-slate-900 ring-slate-200 outline-none focus:ring-2"
          placeholder="0"
        />
      </div>
      {!inDollars && hasValue && <p className="text-sm text-slate-600">{formatMoney(amount)}</p>}
      {errorText && <p className="text-sm text-red-600">{errorText}</p>}
      {options.reserved > 0 && (
        <p className="text-sm text-slate-600">
          Keeping {formatMoney(options.reserved)} for your remaining picks.
        </p>
      )}
    </div>
  );
}
