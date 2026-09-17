import { Suspense } from "react";
import Link from "next/link";

import { ConfigForm } from "@/components/store/ConfigForm";
import { paramsToConfig } from "@/lib/data/config-url";
import { PRESET_MODES } from "@/lib/data/modes";

type CustomModePageProps = {
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

async function CustomModeFormFromSearchParams({ searchParams }: CustomModePageProps) {
  const resolvedSearchParams = await searchParams;
  const parsedConfig = paramsToConfig(searchParamsToUrlSearchParams(resolvedSearchParams));
  const initialConfig = parsedConfig ?? PRESET_MODES[0].config;

  return <ConfigForm initialConfig={initialConfig} />;
}

export default function CustomModePage({ searchParams }: CustomModePageProps) {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          Back to store
        </Link>

        <header className="space-y-4">
          <div className="h-2 w-20 rounded-full bg-slate-400" aria-hidden="true" />
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Custom Mode</h1>
            <p className="text-lg leading-7 text-slate-600">
              Set the rules yourself, then share the link so everyone plays the same setup.
            </p>
          </div>
        </header>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:p-6">
              Loading custom settings…
            </div>
          }
        >
          <CustomModeFormFromSearchParams searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}