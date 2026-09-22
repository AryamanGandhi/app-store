"use client";

import { useState } from "react";

import type { ReactNode } from "react";
import type { SpendOptions } from "@/lib/types";

import { formatMoney } from "@/components/game/format";
import { EqualSpend } from "./EqualSpend";
import { RangeSpend } from "./RangeSpend";
import { StepSpend } from "./StepSpend";
import { MinPlusFreeSpend } from "./MinPlusFreeSpend";

export type SpendPanelProps = {
  options: SpendOptions;
  companyName: string;
  startingBudget: number;
  accentColor: string;
  // The play page keeps the default sticky footer; dev previews turn it off.
  sticky?: boolean;
  onBuy: (amount: number) => void;
};

export function SpendPanel({
  options,
  companyName,
  startingBudget,
  accentColor,
  sticky = true,
  onBuy,
}: SpendPanelProps) {
  // Equal and range know their starting amount, so the Buy button is already
  // correct on the first paint instead of waiting for the control to report it.
  const startingAmount =
    options.kind === "equal" ? (options.fixedAmount ?? 0) : options.kind === "range" ? options.min : 0;
  const [amount, setAmount] = useState(startingAmount);
  const [valid, setValid] = useState(options.kind === "equal" || options.kind === "range");

  const onAmountChange = (nextAmount: number, nextValid: boolean) => {
    setAmount(nextAmount);
    setValid(nextValid);
  };

  // Keying the control on the options and the company remounts it when they
  // change, so a new stock starts from a fresh amount instead of the last one.
  const controlKey = [
    options.kind,
    options.min,
    options.max,
    options.fixedAmount ?? "",
    options.reserved,
    options.steps.map((step) => `${step.percent}:${step.amount}:${step.enabled}`).join(","),
    companyName,
  ].join("|");

  const renderControl = (): ReactNode => {
    switch (options.kind) {
      case "equal":
        return (
          <EqualSpend
            key={controlKey}
            options={options}
            accentColor={accentColor}
            onAmountChange={onAmountChange}
          />
        );
      case "range":
        return (
          <RangeSpend
            key={controlKey}
            options={options}
            accentColor={accentColor}
            onAmountChange={onAmountChange}
          />
        );
      case "steps":
        return (
          <StepSpend
            key={controlKey}
            options={options}
            accentColor={accentColor}
            onAmountChange={onAmountChange}
          />
        );
      case "minPlusFree":
        return (
          <MinPlusFreeSpend
            key={controlKey}
            options={options}
            startingBudget={startingBudget}
            accentColor={accentColor}
            onAmountChange={onAmountChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section
      className={
        "relative w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm " +
        (sticky ? "sticky bottom-0 z-10 md:static" : "")
      }
    >
      <div
        className="absolute top-0 left-0 h-1 w-full rounded-t-2xl"
        style={{ backgroundColor: accentColor }}
      />
      <h2 className="mb-3 text-sm font-medium tracking-wider text-slate-500 uppercase">
        {companyName}
      </h2>
      {options.canBuy ? (
        <>
          {renderControl()}
          <button
            type="button"
            onClick={() => onBuy(amount)}
            disabled={!valid}
            className="mt-4 min-h-11 w-full rounded-2xl border border-slate-200 font-medium text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-300 disabled:text-slate-500"
            style={valid ? { backgroundColor: accentColor } : undefined}
          >
            Buy {formatMoney(amount)} of {companyName}
          </button>
        </>
      ) : (
        <p className="text-sm text-slate-600">
          You can&apos;t afford a pick this round. Skip to continue.
        </p>
      )}
    </section>
  );
}

