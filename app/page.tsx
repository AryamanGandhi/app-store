import { CustomModeCard } from "@/components/store/CustomModeCard";
import { ModeCard } from "@/components/store/ModeCard";
import { PRESET_MODES } from "@/lib/data/modes";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 sm:py-12 lg:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="max-w-2xl space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Game Mode Sandbox
          </h1>
          <p className="text-base leading-7 text-slate-600 sm:text-lg">
            Six versions of the stock draft game. Try them and see which rules you like.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRESET_MODES.map((mode) => (
            <ModeCard key={mode.slug} mode={mode} />
          ))}
          <CustomModeCard />
        </section>
      </div>
    </main>
  );
}