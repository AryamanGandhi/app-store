import { describe, expect, it } from "vitest";
import { getModeBySlug } from "@/lib/data/modes";
import { validateConfig } from "@/lib/engine";
import { formatChange } from "@/lib/lab/columns";
import { getVariant, LAB_VARIANTS } from "@/lib/lab/variants";

describe("LAB_VARIANTS", () => {
  it("builds a valid config from a real preset by changing exactly one rule", () => {
    for (const variant of LAB_VARIANTS) {
      const base = getModeBySlug(variant.baseSlug);
      expect(base, variant.id).toBeDefined();

      const config = variant.change(base!.config);
      const changedRules = Object.keys(config).filter((key) =>
        JSON.stringify(config[key as keyof typeof config]) !== JSON.stringify(base!.config[key as keyof typeof config]));

      expect(validateConfig(config).errors, variant.id).toEqual([]);
      expect(changedRules, variant.id).toHaveLength(1);
    }
  });

  it("finds a variant only under its own preset", () => {
    expect(getVariant("sector-swap", "swapNoSelling")?.name).toBe("Sector Swap, no selling");
    expect(getVariant("classic-draft", "swapNoSelling")).toBeUndefined();
  });
});

describe("formatChange", () => {
  const dollars = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

  it("signs a change and leaves out the sign when it rounds to zero", () => {
    expect(formatChange(dollars, 1234)).toBe("+$1,234");
    expect(formatChange(dollars, -8038)).toBe("-$8,038");
    expect(formatChange(dollars, 0.2)).toBe("$0");
  });
});
