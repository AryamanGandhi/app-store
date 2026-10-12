import type { GameConfig } from "@/lib/types";

// A preset with one rule changed, so the lab can show what that single rule does.
export type LabVariant = {
  id: string;
  baseSlug: string;
  name: string;
  change: (config: GameConfig) => GameConfig;
};

export const LAB_VARIANTS: LabVariant[] = [
  {
    id: "swapNoSelling",
    baseSlug: "sector-swap",
    name: "Sector Swap, no selling",
    change: (config) => ({ ...config, selling: "none" }),
  },
  {
    id: "classicAnyIndustry",
    baseSlug: "classic-draft",
    name: "Classic Draft, any industry",
    change: (config) => ({ ...config, pickDistribution: "any" }),
  },
];

export function getVariant(baseSlug: string, id: string): LabVariant | undefined {
  return LAB_VARIANTS.find((variant) => variant.baseSlug === baseSlug && variant.id === id);
}
