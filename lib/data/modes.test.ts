import { describe, expect, it } from "vitest";
import {
  ALLOCATION_KIND_OPTIONS,
  BOARD_DISTRIBUTION_OPTIONS,
  HOLD_YEARS_OPTIONS,
  PICK_DISTRIBUTION_OPTIONS,
  ROUND_OPTIONS,
  SELLING_OPTIONS,
  STARTING_BUDGET,
  STOCKS_PER_ROUND_OPTIONS,
} from "@/lib/constants";
import { PRESET_MODES, getModeBySlug } from "@/lib/data/modes";

describe("PRESET_MODES", () => {
  it("contains exactly 6 modes", () => {
    expect(PRESET_MODES).toHaveLength(6);
  });

  it("uses unique lowercase hyphenated slugs and excludes custom", () => {
    const slugs = PRESET_MODES.map((mode) => mode.slug);

    expect(new Set(slugs).size).toBe(slugs.length);

    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z-]+$/);
      expect(slug).toBe(slug.toLowerCase());
      expect(slug).not.toBe("custom");
    }
  });

  it("gives every mode 3 to 4 non-empty tags", () => {
    for (const mode of PRESET_MODES) {
      expect(mode.tags.length).toBeGreaterThanOrEqual(3);
      expect(mode.tags.length).toBeLessThanOrEqual(4);

      for (const tag of mode.tags) {
        expect(tag.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("gives every mode 4 to 6 non-empty rules ending in periods", () => {
    for (const mode of PRESET_MODES) {
      expect(mode.rules.length).toBeGreaterThanOrEqual(4);
      expect(mode.rules.length).toBeLessThanOrEqual(6);

      for (const rule of mode.rules) {
        expect(rule.trim().length).toBeGreaterThan(0);
        expect(rule.endsWith(".")).toBe(true);
      }
    }
  });

  it("uses valid 6-digit hex accent colors", () => {
    for (const mode of PRESET_MODES) {
      expect(mode.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("uses STARTING_BUDGET for every config", () => {
    for (const mode of PRESET_MODES) {
      expect(mode.config.startingBudget).toBe(STARTING_BUDGET);
    }
  });

  it("keeps every config within the allowed constant values", () => {
    for (const mode of PRESET_MODES) {
      expect(ROUND_OPTIONS).toContain(mode.config.rounds);
      expect(STOCKS_PER_ROUND_OPTIONS).toContain(mode.config.stocksPerRound);
      expect(HOLD_YEARS_OPTIONS).toContain(mode.config.holdYears);
      expect(BOARD_DISTRIBUTION_OPTIONS).toContain(mode.config.boardDistribution);
      expect(PICK_DISTRIBUTION_OPTIONS).toContain(mode.config.pickDistribution);
      expect(SELLING_OPTIONS).toContain(mode.config.selling);
      expect(ALLOCATION_KIND_OPTIONS).toContain(mode.config.allocation.kind);
    }
  });

  it("matches the exact required configs", () => {
    expect(PRESET_MODES.map((mode) => ({ slug: mode.slug, config: mode.config }))).toEqual([
      {
        slug: "classic-draft",
        config: {
          rounds: 8,
          stocksPerRound: 5,
          holdYears: 10,
          boardDistribution: "onePerIndustry",
          pickDistribution: "onePerIndustry",
          allocation: { kind: "equal" },
          selling: "none",
          startingBudget: STARTING_BUDGET,
        },
      },
      {
        slug: "one-shot",
        config: {
          rounds: 5,
          stocksPerRound: 1,
          holdYears: 5,
          boardDistribution: "any",
          pickDistribution: "any",
          allocation: { kind: "steps", percents: [10, 20, 30, 40, 50] },
          selling: "none",
          startingBudget: STARTING_BUDGET,
        },
      },
      {
        slug: "budget-boss",
        config: {
          rounds: 6,
          stocksPerRound: 8,
          holdYears: "indefinite",
          boardDistribution: "onePerIndustry",
          pickDistribution: "any",
          allocation: { kind: "minPlusFree", min: 500 },
          selling: "none",
          startingBudget: STARTING_BUDGET,
        },
      },
      {
        slug: "active-trader",
        config: {
          rounds: 10,
          stocksPerRound: 10,
          holdYears: 3,
          boardDistribution: "any",
          pickDistribution: "any",
          allocation: { kind: "range", min: 500, max: 3000 },
          selling: "any",
          startingBudget: STARTING_BUDGET,
        },
      },
      {
        slug: "sector-swap",
        config: {
          rounds: 8,
          stocksPerRound: 8,
          holdYears: "indefinite",
          boardDistribution: "onePerIndustry",
          pickDistribution: "onePerIndustry",
          allocation: { kind: "steps", percents: [5, 10, 15, 20, 25] },
          selling: "sameIndustry",
          startingBudget: STARTING_BUDGET,
        },
      },
      {
        slug: "sector-focus",
        config: {
          rounds: 8,
          stocksPerRound: 5,
          holdYears: 5,
          boardDistribution: "sameIndustry",
          pickDistribution: "any",
          allocation: { kind: "equal" },
          selling: "none",
          startingBudget: STARTING_BUDGET,
        },
      },
    ]);
  });

  it("finds modes by slug and returns undefined for an unknown slug", () => {
    for (const mode of PRESET_MODES) {
      expect(getModeBySlug(mode.slug)).toBe(mode);
    }

    expect(getModeBySlug("unknown-mode")).toBeUndefined();
  });

  it("covers every board distribution and allocation kind, and includes a 10-stock round", () => {
    const boardDistributions = new Set(PRESET_MODES.map((mode) => mode.config.boardDistribution));
    const allocationKinds = new Set(PRESET_MODES.map((mode) => mode.config.allocation.kind));

    expect(boardDistributions).toEqual(new Set(BOARD_DISTRIBUTION_OPTIONS));
    expect(allocationKinds).toEqual(new Set(ALLOCATION_KIND_OPTIONS));
    expect(PRESET_MODES.some((mode) => mode.config.stocksPerRound === 10)).toBe(true);
  });
});