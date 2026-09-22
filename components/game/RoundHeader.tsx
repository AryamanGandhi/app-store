import { formatMoney } from "./format";
import type { Industry } from "@/lib/types";

export type RoundHeaderProps = {
  modeName: string;
  round: number;
  totalRounds: number;
  year: number;
  cash: number;
  accentColor: string;
  industry?: Industry;
};

export function RoundHeader({
  modeName,
  round,
  totalRounds,
  year,
  cash,
  accentColor,
  industry,
}: RoundHeaderProps) {
  return (
    <header className="sticky top-0 z-20 mb-4 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:static">
      <div className="h-1 w-full rounded" style={{ backgroundColor: accentColor }} />
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-600">{modeName}</p>
          <p className="text-xs text-slate-500">
            Round {round} of {totalRounds} • Year {year}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Cash</p>
          <p className="text-3xl font-extrabold text-slate-900">{formatMoney(cash)}</p>
        </div>
      </div>
      {industry ? (
        <p className="mt-2 text-sm text-slate-600">All {industry} this round.</p>
      ) : null}
    </header>
  );
}
