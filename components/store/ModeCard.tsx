import Link from "next/link";

import type { Mode } from "@/lib/types";

type ModeCardProps = {
  mode: Mode;
};

export function ModeCard({ mode }: ModeCardProps) {
  return (
    <Link
      href={`/modes/${mode.slug}`}
      className="group flex min-h-44 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
    >
      <div className="h-2 w-full" style={{ backgroundColor: mode.accentColor }} />
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{mode.name}</h2>
          <p className="text-sm leading-6 text-slate-600">{mode.tagline}</p>
        </div>
        <ul className="mt-auto flex flex-wrap gap-2" aria-label={`${mode.name} tags`}>
          {mode.tags.map((tag) => (
            <li
              key={tag}
              className="min-h-11 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}