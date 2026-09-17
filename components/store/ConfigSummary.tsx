import type { GameConfig } from "@/lib/types";

import { configRows } from "@/components/store/config-labels";

type ConfigSummaryProps = {
  config: GameConfig;
  accentColor: string;
};

export function ConfigSummary({ config, accentColor }: ConfigSummaryProps) {
  const rows = configRows(config);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="at-a-glance-heading">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: accentColor }} aria-hidden="true" />
        <h2 id="at-a-glance-heading" className="text-lg font-semibold tracking-tight text-slate-900">
          At a glance
        </h2>
      </div>

      <dl className="mt-4 divide-y divide-slate-200">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <dt className="text-sm font-medium text-slate-500">{row.label}</dt>
            <dd className="text-sm leading-6 text-slate-900 sm:max-w-[26rem] sm:text-right">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}