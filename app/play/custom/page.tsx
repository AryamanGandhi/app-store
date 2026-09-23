import { Suspense } from "react";
import Link from "next/link";

import { PlayGame } from "@/app/play/PlayGame";
import { paramsToConfig } from "@/lib/data/config-url";
import { validateConfig } from "@/lib/engine";

type CustomPlayPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function searchParamsToUrlSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const urlSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      urlSearchParams.set(key, value);
    }
  }

  return urlSearchParams;
}

async function CustomPlayFromSearchParams({ searchParams }: CustomPlayPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentParams = searchParamsToUrlSearchParams(resolvedSearchParams);
  const config = paramsToConfig(currentParams);
  const changeSettingsHref = `/modes/custom${currentParams.size > 0 ? `?${currentParams.toString()}` : ""}`;

  if (config === null) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-12">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">This custom setup doesn&apos;t work</h1>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>The URL is missing one or more required settings.</li>
          </ul>
          <Link
            href={changeSettingsHref}
            className="inline-flex min-h-11 items-center text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Change settings
          </Link>
        </div>
      </main>
    );
  }

  const validation = validateConfig(config);

  if (validation.errors.length > 0) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-12">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">This custom setup doesn&apos;t work</h1>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {validation.errors.map((error) => (
              <li key={`${error.field}-${error.message}`}>{error.message}</li>
            ))}
          </ul>
          <Link
            href={changeSettingsHref}
            className="inline-flex min-h-11 items-center text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Change settings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
        <Link
          href={changeSettingsHref}
          className="inline-flex min-h-11 items-center text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          Change settings
        </Link>
      </div>
      <PlayGame config={config} modeName="Custom Mode" accentColor="#64748b" />
    </div>
  );
}

export default function CustomPlayPage({ searchParams }: CustomPlayPageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-12">
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:p-6">
            Loading custom setup…
          </div>
        </main>
      }
    >
      <CustomPlayFromSearchParams searchParams={searchParams} />
    </Suspense>
  );
}