"use client";

import { useEffect, useState } from "react";

import type { SpendOptions } from "@/lib/types";

import { formatMoney } from "@/components/game/format";

export type RangeSpendProps = {
  options: SpendOptions;
  accentColor: string;
  onAmountChange: (amount: number, valid: boolean) => void;
};

const STEP = 100;

export function RangeSpend({ options, accentColor, onAmountChange }: RangeSpendProps) {
  const { min, max } = options;
  const [amount, setAmount] = useState(min);

  useEffect(() => {
    onAmountChange(amount, true);
  }, [amount, onAmountChange]);

  const clamp = (value: number) => Math.min(Math.max(value, min), max);
  const toMin = () => setAmount(clamp(amount - STEP));
  const toMax = () => setAmount(clamp(amount + STEP));

  return (
    <div className="space-y-3">
      <p className="text-3xl font-semibold text-slate-900">{formatMoney(amount)}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toMin}
          className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-xl font-medium text-slate-700 hover:bg-slate-50"
          aria-label="Decrease amount"
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor }}
        />
        <button
          type="button"
          onClick={toMax}
          className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-xl font-medium text-slate-700 hover:bg-slate-50"
          aria-label="Increase amount"
        >
          +
        </button>
      </div>
      {options.reserved > 0 && (
        <p className="text-sm text-slate-600">
          Keeping {formatMoney(options.reserved)} for your remaining picks.
        </p>
      )}
    </div>
  );
}
