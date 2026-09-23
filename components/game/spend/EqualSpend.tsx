import { useEffect } from "react";

import type { SpendOptions } from "@/lib/types";

import { formatMoney } from "@/components/game/format";

export type EqualSpendProps = {
  options: SpendOptions;
  accentColor: string;
  onAmountChange: (amount: number, valid: boolean) => void;
};

export function EqualSpend({ options, onAmountChange }: EqualSpendProps) {
  const amount = options.fixedAmount ?? 0;
  useEffect(() => {
    onAmountChange(amount, true);
  }, [amount, onAmountChange]);

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">
        This pick gets {formatMoney(amount)}.
      </p>
      <p className="text-sm text-slate-600">
        Your cash is split evenly across your remaining picks.
      </p>
    </div>
  );
}
