"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  BOARD_DISTRIBUTION_OPTIONS,
  HOLD_YEARS_OPTIONS,
  PICK_DISTRIBUTION_OPTIONS,
  ROUND_OPTIONS,
  SELLING_OPTIONS,
  STARTING_BUDGET,
  STOCKS_PER_ROUND_OPTIONS,
} from "@/lib/constants";
import { configToParams } from "@/lib/data/config-url";
import { PRESET_MODES } from "@/lib/data/modes";
import { describeConfig, validateConfig } from "@/lib/engine";
import type { AllocationRule, ConfigIssue, GameConfig } from "@/lib/types";

const STEP_PRESET_TEN_TO_FIFTY = [10, 20, 30, 40, 50] as const;
const STEP_PRESET_FIVE_TO_TWENTY_FIVE = [5, 10, 15, 20, 25] as const;

type ConfigFormProps = {
  initialConfig: GameConfig;
};

type SectionKey =
  | "rounds"
  | "stocksPerRound"
  | "holdYears"
  | "boardDistribution"
  | "pickDistribution"
  | "allocation"
  | "selling";

const MONEY_PRESETS = {
  equal: { kind: "equal" } as AllocationRule,
  stepsTenToFifty: { kind: "steps", percents: [...STEP_PRESET_TEN_TO_FIFTY] } as AllocationRule,
  stepsFiveToTwentyFive: { kind: "steps", percents: [...STEP_PRESET_FIVE_TO_TWENTY_FIVE] } as AllocationRule,
  range: { kind: "range", min: 500, max: 3000 } as AllocationRule,
  minPlusFree: { kind: "minPlusFree", min: 500 } as AllocationRule,
} as const;

const sectionLabels: Record<SectionKey, string> = {
  rounds: "Rounds",
  stocksPerRound: "Stocks shown per round",
  holdYears: "Hold time",
  boardDistribution: "Board",
  pickDistribution: "Picks",
  allocation: "Money",
  selling: "Selling",
};

const boardOptionLabels: Record<GameConfig["boardDistribution"], string> = {
  onePerIndustry: "One per industry",
  any: "Any industries",
  sameIndustry: "All from one industry",
};

const pickOptionLabels: Record<GameConfig["pickDistribution"], string> = {
  onePerIndustry: "One per industry",
  any: "No limit",
};

const sellingOptionLabels: Record<GameConfig["selling"], string> = {
  none: "No selling",
  any: "Sell any stock",
  sameIndustry: "Sell and replace from the same industry",
};

const moneyKindLabels = {
  equal: "Equal split",
  steps: "Set amounts",
  range: "A range",
  minPlusFree: "Minimum plus extra",
} as const;

const sectionsByField: Record<SectionKey, SectionKey> = {
  rounds: "rounds",
  stocksPerRound: "stocksPerRound",
  holdYears: "holdYears",
  boardDistribution: "boardDistribution",
  pickDistribution: "pickDistribution",
  allocation: "allocation",
  selling: "selling",
};

const optionButtonClass = (selected: boolean) =>
  `min-h-11 rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
    selected
      ? "border-slate-900 bg-slate-900 text-white"
      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900"
  }`;

const sectionClass = "space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";

const shallowCloneConfig = (config: GameConfig): GameConfig => ({
  ...config,
  allocation:
    config.allocation.kind === "equal"
      ? { kind: "equal" }
      : config.allocation.kind === "range"
        ? { kind: "range", min: config.allocation.min, max: config.allocation.max }
        : config.allocation.kind === "steps"
          ? { kind: "steps", percents: [...config.allocation.percents] }
          : { kind: "minPlusFree", min: config.allocation.min },
});

const toSearch = (config: GameConfig) => new URLSearchParams(configToParams(config)).toString();

const sameSteps = (allocation: AllocationRule, percents: number[]) =>
  allocation.kind === "steps" && allocation.percents.join(",") === percents.join(",");

export function ConfigForm({ initialConfig }: ConfigFormProps) {
  const router = useRouter();
  const [config, setConfig] = useState<GameConfig>(() => shallowCloneConfig(initialConfig));

  const details = useMemo(() => validateConfig(config), [config]);
  const rules = useMemo(() => describeConfig(config), [config]);

  const errorsBySection = useMemo(() => {
    const grouped = new Map<SectionKey, ConfigIssue[]>();

    for (const error of details.errors) {
      const section = sectionsByField[error.field as SectionKey];

      if (section === undefined) {
        continue;
      }

      const current = grouped.get(section) ?? [];
      current.push(error);
      grouped.set(section, current);
    }

    return grouped;
  }, [details.errors]);

  const unmappedErrors = useMemo(
    () => details.errors.filter((error) => !(error.field in sectionsByField)),
    [details.errors],
  );

  const totalPerPick = Math.floor((STARTING_BUDGET / config.rounds) * 100) / 100;

  const updateConfig = (updater: (current: GameConfig) => GameConfig) => {
    setConfig((current) => shallowCloneConfig(updater(current)));
  };

  const selectMoneyKind = (kind: AllocationRule["kind"]) => {
    updateConfig((current) => ({
      ...current,
      allocation:
        kind === "equal"
          ? MONEY_PRESETS.equal
          : kind === "steps"
            ? MONEY_PRESETS.stepsTenToFifty
            : kind === "range"
              ? MONEY_PRESETS.range
              : MONEY_PRESETS.minPlusFree,
    }));
  };

  const startGame = () => {
    if (details.errors.length > 0) {
      return;
    }

    router.push(`/play/custom?${toSearch(config)}`);
  };

  const renderSectionErrors = (section: SectionKey) => {
    const errors = errorsBySection.get(section) ?? [];

    if (errors.length === 0) {
      return null;
    }

    return (
      <ul className="space-y-1 text-sm text-rose-700" aria-live="polite">
        {errors.map((error) => (
          <li key={`${section}-${error.message}`}>{error.message}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Start from a preset</h2>
        <div className="flex flex-wrap gap-3">
          {PRESET_MODES.map((mode) => (
            <button
              key={mode.slug}
              type="button"
              className={optionButtonClass(false)}
              onClick={() => setConfig(shallowCloneConfig(mode.config))}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{sectionLabels.rounds}</h2>
        <div className="flex flex-wrap gap-3">
          {ROUND_OPTIONS.map((rounds) => (
            <button
              key={rounds}
              type="button"
              className={optionButtonClass(config.rounds === rounds)}
              aria-pressed={config.rounds === rounds}
              onClick={() => updateConfig((current) => ({ ...current, rounds }))}
            >
              {rounds}
            </button>
          ))}
        </div>
        {renderSectionErrors("rounds")}
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{sectionLabels.stocksPerRound}</h2>
        <div className="flex flex-wrap gap-3">
          {STOCKS_PER_ROUND_OPTIONS.map((stocksPerRound) => (
            <button
              key={stocksPerRound}
              type="button"
              className={optionButtonClass(config.stocksPerRound === stocksPerRound)}
              aria-pressed={config.stocksPerRound === stocksPerRound}
              onClick={() => updateConfig((current) => ({ ...current, stocksPerRound }))}
            >
              {stocksPerRound}
            </button>
          ))}
        </div>
        {renderSectionErrors("stocksPerRound")}
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{sectionLabels.holdYears}</h2>
        <div className="flex flex-wrap gap-3">
          {HOLD_YEARS_OPTIONS.map((holdYears) => (
            <button
              key={holdYears}
              type="button"
              className={optionButtonClass(config.holdYears === holdYears)}
              aria-pressed={config.holdYears === holdYears}
              onClick={() => updateConfig((current) => ({ ...current, holdYears }))}
            >
              {holdYears === "indefinite" ? "Until the game ends" : `${holdYears} years`}
            </button>
          ))}
        </div>
        {renderSectionErrors("holdYears")}
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{sectionLabels.boardDistribution}</h2>
        <div className="flex flex-wrap gap-3">
          {BOARD_DISTRIBUTION_OPTIONS.map((boardDistribution) => (
            <button
              key={boardDistribution}
              type="button"
              className={optionButtonClass(config.boardDistribution === boardDistribution)}
              aria-pressed={config.boardDistribution === boardDistribution}
              onClick={() => updateConfig((current) => ({ ...current, boardDistribution }))}
            >
              {boardOptionLabels[boardDistribution]}
            </button>
          ))}
        </div>
        {renderSectionErrors("boardDistribution")}
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{sectionLabels.pickDistribution}</h2>
        <div className="flex flex-wrap gap-3">
          {PICK_DISTRIBUTION_OPTIONS.map((pickDistribution) => (
            <button
              key={pickDistribution}
              type="button"
              className={optionButtonClass(config.pickDistribution === pickDistribution)}
              aria-pressed={config.pickDistribution === pickDistribution}
              onClick={() => updateConfig((current) => ({ ...current, pickDistribution }))}
            >
              {pickOptionLabels[pickDistribution]}
            </button>
          ))}
        </div>
        {renderSectionErrors("pickDistribution")}
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{sectionLabels.allocation}</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(moneyKindLabels).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              className={optionButtonClass(config.allocation.kind === kind)}
              aria-pressed={config.allocation.kind === kind}
              onClick={() => selectMoneyKind(kind as AllocationRule["kind"])}
            >
              {label}
            </button>
          ))}
        </div>

        {config.allocation.kind === "equal" ? (
          <p className="text-sm leading-6 text-slate-600">
            Your cash is split evenly across your remaining picks (starts at ${totalPerPick.toLocaleString("en-US", { maximumFractionDigits: 2 })} a pick)
          </p>
        ) : null}

        {config.allocation.kind === "steps" ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={optionButtonClass(sameSteps(config.allocation, [...STEP_PRESET_TEN_TO_FIFTY]))}
              aria-pressed={sameSteps(config.allocation, [...STEP_PRESET_TEN_TO_FIFTY])}
              onClick={() =>
                updateConfig((current) => ({ ...current, allocation: MONEY_PRESETS.stepsTenToFifty }))
              }
            >
              10% to 50%
            </button>
            <button
              type="button"
              className={optionButtonClass(sameSteps(config.allocation, [...STEP_PRESET_FIVE_TO_TWENTY_FIVE]))}
              aria-pressed={sameSteps(config.allocation, [...STEP_PRESET_FIVE_TO_TWENTY_FIVE])}
              onClick={() =>
                updateConfig((current) => ({ ...current, allocation: MONEY_PRESETS.stepsFiveToTwentyFive }))
              }
            >
              5% to 25%
            </button>
          </div>
        ) : null}

        {config.allocation.kind === "range" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Minimum per pick</span>
              <input
                type="number"
                min={0}
                value={config.allocation.min}
                onChange={(event) => {
                  const min = Number(event.target.value);
                  updateConfig((current) => ({
                    ...current,
                    allocation: { kind: "range", min, max: current.allocation.kind === "range" ? current.allocation.max : 3000 },
                  }));
                }}
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Maximum per pick</span>
              <input
                type="number"
                min={0}
                value={config.allocation.max}
                onChange={(event) => {
                  const max = Number(event.target.value);
                  updateConfig((current) => ({
                    ...current,
                    allocation: { kind: "range", min: current.allocation.kind === "range" ? current.allocation.min : 500, max },
                  }));
                }}
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              />
            </label>
          </div>
        ) : null}

        {config.allocation.kind === "minPlusFree" ? (
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Minimum per pick</span>
            <input
              type="number"
              min={0}
              value={config.allocation.min}
              onChange={(event) => {
                const min = Number(event.target.value);
                updateConfig((current) => ({ ...current, allocation: { kind: "minPlusFree", min } }));
              }}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            />
          </label>
        ) : null}

        {renderSectionErrors("allocation")}
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{sectionLabels.selling}</h2>
        <div className="flex flex-wrap gap-3">
          {SELLING_OPTIONS.map((selling) => (
            <button
              key={selling}
              type="button"
              className={optionButtonClass(config.selling === selling)}
              aria-pressed={config.selling === selling}
              onClick={() => updateConfig((current) => ({ ...current, selling }))}
            >
              {sellingOptionLabels[selling]}
            </button>
          ))}
        </div>
        {renderSectionErrors("selling")}
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Your rules</h2>
        <ul className="space-y-2 text-sm leading-6 text-slate-700">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      {details.warnings.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-amber-950">Warnings</h2>
          <ul className="mt-3 space-y-2">
            {details.warnings.map((warning) => (
              <li key={`${warning.field}-${warning.message}`}>{warning.message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {details.errors.length > 0 || unmappedErrors.length > 0 ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-rose-900">Fix these before you start</h2>
          <ul className="mt-3 space-y-2">
            {details.errors.map((error) => (
              <li key={`${error.field}-${error.message}`}>{error.message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <button
        type="button"
        onClick={startGame}
        disabled={details.errors.length > 0}
        className="min-h-12 w-full rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      >
        Start
      </button>
    </div>
  );
}