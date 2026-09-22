"use client";

import { formatMoney } from "./format";
import type { BoardEntry } from "@/lib/types";

export type StockCardProps = {
  entry: BoardEntry;
  selected: boolean;
  accentColor: string;
  hideIndustry: boolean;
  onSelect: (ticker: string) => void;
};

export function StockCard({
  entry,
  selected,
  accentColor,
  hideIndustry,
  onSelect,
}: StockCardProps) {
  const pickable = entry.pickable;
  const isSelected = pickable && selected;

  const cardClassName = [
    "flex w-full flex-col items-start gap-1 rounded-2xl border bg-white p-4 text-left shadow-sm min-h-11 transition",
    isSelected ? "border-2" : "border",
    pickable ? "hover:border-slate-300" : "opacity-60",
    "disabled:cursor-not-allowed",
  ].join(" ");

  return (
    <button
      type="button"
      disabled={!pickable}
      aria-pressed={isSelected}
      onClick={() => onSelect(entry.stock.ticker)}
      className={cardClassName}
      style={isSelected ? { borderColor: accentColor } : undefined}
    >
      <div className="flex w-full flex-col">
        <p className="text-sm font-medium text-slate-500">{entry.stock.ticker}</p>
        <p className="text-lg font-semibold text-slate-900">{entry.stock.name}</p>
        {!hideIndustry ? (
          <span className="mt-0.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {entry.stock.industry}
          </span>
        ) : null}
        <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(entry.price)}</p>
        {!pickable && entry.reason ? (
          <p className="mt-1 text-sm text-slate-500">{entry.reason}</p>
        ) : null}
      </div>
    </button>
  );
}
