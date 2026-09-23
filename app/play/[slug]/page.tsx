import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlayGame } from "@/app/play/PlayGame";
import { PRESET_MODES, getModeBySlug } from "@/lib/data/modes";

type PlayPresetPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return PRESET_MODES.map((mode) => ({ slug: mode.slug }));
}

export async function generateMetadata({ params }: PlayPresetPageProps): Promise<Metadata> {
  const { slug } = await params;
  const mode = getModeBySlug(slug);

  if (mode === undefined) {
    return {};
  }

  return {
    title: mode.name,
  };
}

export default async function PlayPresetPage({ params }: PlayPresetPageProps) {
  const { slug } = await params;
  const mode = getModeBySlug(slug);

  if (mode === undefined) {
    notFound();
  }

  return <PlayGame config={mode.config} modeName={mode.name} accentColor={mode.accentColor} />;
}