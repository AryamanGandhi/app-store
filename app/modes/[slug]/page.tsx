import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfigSummary } from "@/components/store/ConfigSummary";
import { PRESET_MODES, getModeBySlug } from "@/lib/data/modes";

type ModePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return PRESET_MODES.map((mode) => ({ slug: mode.slug }));
}

export async function generateMetadata({ params }: ModePageProps): Promise<Metadata> {
  const { slug } = await params;
  const mode = getModeBySlug(slug);

  if (mode === undefined) {
    return {};
  }

  return {
    title: mode.name,
    description: mode.tagline,
  };
}

export default async function ModeInfoPage({ params }: ModePageProps) {
  const { slug } = await params;
  const mode = getModeBySlug(slug);

  if (mode === undefined) {
    notFound();
  }

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
          <div className="h-2 w-20 rounded-full" style={{ backgroundColor: mode.accentColor }} aria-hidden="true" />
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: mode.accentColor }}>
              {mode.name}
            </h1>
            <p className="text-lg leading-7 text-slate-600">{mode.tagline}</p>
          </div>
        </header>

        <ConfigSummary config={mode.config} accentColor={mode.accentColor} />

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">How it works</h2>
          <ol className="space-y-3 pl-5 text-base leading-7 text-slate-700">
            {mode.rules.map((rule) => (
              <li key={rule} className="pl-1 marker:text-slate-400">
                {rule}
              </li>
            ))}
          </ol>
        </section>

        <Link
          href={`/play/${mode.slug}`}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          style={{ backgroundColor: mode.accentColor }}
        >
          Play
        </Link>
      </div>
    </main>
  );
}