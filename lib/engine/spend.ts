import type { AllocationKind, GameState, SpendOptions } from "@/lib/types";

const roundToCents = (value: number) => Math.round(value * 100) / 100;

const unavailableOptions = (kind: AllocationKind): SpendOptions => ({
  kind,
  canBuy: false,
  min: 0,
  max: 0,
  fixedAmount: null,
  steps: [],
  reserved: 0,
});

export function getSpendOptions(state: GameState): SpendOptions {
  const allocation = state.config.allocation;
  const kind = allocation.kind;
  const picksLeft = state.config.rounds - state.round + 1;

  if (state.status === "done") {
    return unavailableOptions(kind);
  }

  if (allocation.kind === "equal") {
    const amount = picksLeft <= 1 ? roundToCents(state.cash) : Math.floor(Math.round(state.cash * 100) / picksLeft) / 100;

    return {
      kind: "equal",
      canBuy: amount > 0,
      min: amount,
      max: amount,
      fixedAmount: amount,
      steps: [],
      reserved: roundToCents(state.cash - amount),
    };
  }

  if (allocation.kind === "range") {
    const reserved = roundToCents((picksLeft - 1) * allocation.min);
    const max = roundToCents(Math.min(allocation.max, state.cash - reserved));

    return {
      kind: "range",
      canBuy: max >= allocation.min,
      min: allocation.min,
      max,
      fixedAmount: null,
      steps: [],
      reserved,
    };
  }

  if (allocation.kind === "steps") {
    const percents = allocation.percents;
    const amounts = percents.map((percent) => roundToCents((percent * state.config.startingBudget) / 100));
    const smallest = Math.min(...amounts);
    const reserved = roundToCents((picksLeft - 1) * smallest);
    const available = roundToCents(state.cash - reserved);
    const steps = percents.map((percent, index) => ({
      percent,
      amount: amounts[index],
      enabled: amounts[index] <= available,
    }));
    const enabledAmounts = steps.filter((step) => step.enabled).map((step) => step.amount);

    return {
      kind: "steps",
      canBuy: enabledAmounts.length > 0,
      min: smallest,
      max: enabledAmounts.length > 0 ? Math.max(...enabledAmounts) : 0,
      fixedAmount: null,
      steps,
      reserved,
    };
  }

  if (allocation.kind === "minPlusFree") {
    const reserved = roundToCents((picksLeft - 1) * allocation.min);
    const max = roundToCents(state.cash - reserved);

    return {
      kind: "minPlusFree",
      canBuy: max >= allocation.min,
      min: allocation.min,
      max,
      fixedAmount: null,
      steps: [],
      reserved,
    };
  }

  return unavailableOptions(kind);
}

// The game loop uses this to check that a requested amount matches the options it was shown.
export function isAmountAllowed(options: SpendOptions, amount: number): boolean {
  if (!options.canBuy || !Number.isFinite(amount) || amount <= 0) {
    return false;
  }

  if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6) {
    return false;
  }

  if (options.kind === "equal") {
    return amount === options.fixedAmount;
  }

  if (options.kind === "steps") {
    return options.steps.some((step) => step.enabled && step.amount === amount);
  }

  return amount >= options.min && amount <= options.max;
}