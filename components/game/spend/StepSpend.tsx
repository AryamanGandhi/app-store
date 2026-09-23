"use client";

import { useEffect, useState } from "react";

import type { SpendOptions } from "@/lib/types";

import { formatMoney } from "@/components/game/format";

export type StepSpendProps = {
  options: SpendOptions;
  accentColor: string;
  onAmountChange: (amount: number, valid: boolean) => void;
};

export function StepSpend({ options, accentColor, onAmountChange }: StepSpendProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const select = (index: number) => {
    if (!options.steps[index].enabled) return;
    setSelectedIndex(index);
  };

  useEffect(() => {
    const step = options.steps[selectedIndex ?? -1];
    if (selectedIndex != null && step && step.enabled) {
      onAmountChange(step.amount, true);
    } else {
      onAmountChange(0, false);
    }
  }, [selectedIndex, options.steps, onAmountChange]);

  return (
    <div className="space-y-3">
      <fieldset className="flex flex-wrap gap-3">
        {options.steps.map((step, index) => {
          const selected = selectedIndex === index;
          const disabled = !step.enabled;
          const classes = disabled
            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
            : selected
              ? "bg-white text-slate-900 font-semibold"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300";
          return (
            <button
              key={`${step.percent}-${step.amount}`}
              type="button"
              onClick={() => select(index)}
              disabled={disabled}
              aria-pressed={selected}
              style={{
                borderColor: selected && !disabled ? accentColor : undefined,
              }}
              className={
                "min-h-11 min-w-[96px] flex-1 flex-col rounded-2xl border-2 px-3 py-2 text-center shadow-sm " +
                classes
              }
            >
              <span className="block text-base font-medium">{step.percent}%</span>
              <span className="block text-sm">{formatMoney(step.amount)}</span>
            </button>
          );
        })}
      </fieldset>
      {options.reserved > 0 && (
        <p className="text-sm text-slate-600">
          Keeping {formatMoney(options.reserved)} for your remaining picks.
        </p>
      )}
    </div>
  );
}
