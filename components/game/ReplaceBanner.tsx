import type { Industry } from "@/lib/types";

export type ReplaceBannerProps = {
  industry: Industry;
  accentColor: string;
};

export function ReplaceBanner({ industry, accentColor }: ReplaceBannerProps) {
  return (
    <section
      aria-label="Replace stock notice"
      className="rounded-2xl border-4 bg-white p-4 shadow-sm"
      style={{ borderColor: accentColor }}
    >
      <h2 className="text-lg font-bold text-slate-900">
        You sold your {industry} stock. Pick a new {industry} stock to finish this round.
      </h2>
    </section>
  );
}
