import Link from "next/link";

export function CustomModeCard() {
  return (
    <Link
      href="/modes/custom"
      className="group flex min-h-44 flex-col justify-between rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 sm:p-6"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Custom Mode</h2>
        <p className="text-sm leading-6 text-slate-600">Pick every rule yourself.</p>
      </div>
      <span className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-slate-500">
        Build your own setup
      </span>
    </Link>
  );
}