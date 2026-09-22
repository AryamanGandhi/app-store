import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  sampleSpendBlocked,
  sampleSpendEqual,
  sampleSpendMinPlusFree,
  sampleSpendRange,
  sampleSpendSteps,
} from "@/lib/fixtures";
import { formatMoney } from "@/components/game/format";
import { SpendPanel } from "@/components/game/spend/SpendPanel";

// The project's vitest config does not enable global hooks, so RTL's
// automatic afterEach cleanup never registers. Register it per-file so
// multi-render test files don't accumulate DOM between tests.
afterEach(cleanup);

const companyName = "Quantara Systems";

describe("SpendPanel", () => {
  it("shows a skip-only message and no Buy button when the player cannot buy", () => {
    render(
      <SpendPanel
        options={sampleSpendBlocked}
        companyName={companyName}
        startingBudget={10000}
        accentColor="#2563eb"
        onBuy={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/You can't afford a pick this round\. Skip to continue\./i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Buy/i })).not.toBeInTheDocument();
  });

  it("renders the equal control with a fixed amount and an enabled Buy button", () => {
    const onBuy = vi.fn();
    render(
      <SpendPanel
        options={sampleSpendEqual}
        companyName={companyName}
        startingBudget={10000}
        accentColor="#2563eb"
        onBuy={onBuy}
      />,
    );

    expect(
      screen.getByText(`This pick gets ${formatMoney(sampleSpendEqual.fixedAmount!)}.`),
    ).toBeInTheDocument();
    const buy = screen.getByRole("button", {
      name: `Buy ${formatMoney(sampleSpendEqual.fixedAmount!)} of ${companyName}`,
    });
    expect(buy).toBeEnabled();
    fireEvent.click(buy);
    expect(onBuy).toHaveBeenCalledWith(sampleSpendEqual.fixedAmount);
  });

  it("renders the range control with the minimum selected and an enabled Buy button", () => {
    const onBuy = vi.fn();
    render(
      <SpendPanel
        options={sampleSpendRange}
        companyName={companyName}
        startingBudget={10000}
        accentColor="#2563eb"
        onBuy={onBuy}
      />,
    );

    const buy = screen.getByRole("button", {
      name: `Buy ${formatMoney(sampleSpendRange.min)} of ${companyName}`,
    });
    expect(buy).toBeEnabled();
    fireEvent.click(buy);
    expect(onBuy).toHaveBeenCalledWith(sampleSpendRange.min);
  });

  it("keeps the Buy button disabled for steps until a step is selected", () => {
    const onBuy = vi.fn();
    render(
      <SpendPanel
        options={sampleSpendSteps}
        companyName={companyName}
        startingBudget={10000}
        accentColor="#2563eb"
        onBuy={onBuy}
      />,
    );

    const buy = screen.getByRole("button", { name: /Buy/i });
    expect(buy).toBeDisabled();

    const first = sampleSpendSteps.steps[0];
    fireEvent.click(screen.getAllByRole("button")[0]);

    const buyNow = screen.getByRole("button", {
      name: `Buy ${formatMoney(first.amount)} of ${companyName}`,
    });
    expect(buyNow).toBeEnabled();
    fireEvent.click(buyNow);
    expect(onBuy).toHaveBeenCalledWith(first.amount);
  });

  it("keeps the Buy button disabled for min-plus-free until a valid amount is entered", () => {
    const onBuy = vi.fn();
    render(
      <SpendPanel
        options={sampleSpendMinPlusFree}
        companyName={companyName}
        startingBudget={10000}
        accentColor="#2563eb"
        onBuy={onBuy}
      />,
    );

    const buy = screen.getByRole("button", { name: /Buy/i });
    expect(buy).toBeDisabled();

    const input = screen.getByLabelText(/Dollar amount/i);
    fireEvent.change(input, { target: { value: "600" } });

    const buyNow = screen.getByRole("button", {
      name: `Buy ${formatMoney(600)} of ${companyName}`,
    });
    expect(buyNow).toBeEnabled();
    fireEvent.click(buyNow);
    expect(onBuy).toHaveBeenCalledWith(600);
  });

  it("shows the reserved helper text only when reserved > 0", () => {
    render(
      <SpendPanel
        options={{ ...sampleSpendEqual, reserved: 0 }}
        companyName={companyName}
        startingBudget={10000}
        accentColor="#2563eb"
        onBuy={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Keeping .* for your remaining picks\./i)).not.toBeInTheDocument();
  });

  it("shows the reserved helper text exactly once for range, steps and min-plus-free", () => {
    for (const options of [sampleSpendRange, sampleSpendSteps, sampleSpendMinPlusFree]) {
      render(
        <SpendPanel
          options={options}
          companyName={companyName}
          startingBudget={10000}
          accentColor="#2563eb"
          onBuy={vi.fn()}
        />,
      );

      expect(
        screen.getAllByText(`Keeping ${formatMoney(options.reserved)} for your remaining picks.`),
      ).toHaveLength(1);

      cleanup();
    }
  });

  it("starts a fresh amount when the selected company changes", () => {
    const { rerender } = render(
      <SpendPanel
        options={sampleSpendRange}
        companyName={companyName}
        startingBudget={10000}
        accentColor="#2563eb"
        onBuy={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /increase amount/i }));
    expect(
      screen.getByRole("button", {
        name: `Buy ${formatMoney(sampleSpendRange.min + 100)} of ${companyName}`,
      }),
    ).toBeInTheDocument();

    rerender(
      <SpendPanel
        options={sampleSpendRange}
        companyName="Lumex Grid"
        startingBudget={10000}
        accentColor="#2563eb"
        onBuy={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: `Buy ${formatMoney(sampleSpendRange.min)} of Lumex Grid`,
      }),
    ).toBeInTheDocument();
  });

  it("greys out the Buy button instead of using the accent colour when the amount is invalid", () => {
    render(
      <SpendPanel
        options={sampleSpendMinPlusFree}
        companyName={companyName}
        startingBudget={10000}
        accentColor="#2563eb"
        onBuy={vi.fn()}
      />,
    );

    const buy = screen.getByRole("button", { name: /Buy/i });
    expect(buy).toBeDisabled();
    expect(buy).not.toHaveAttribute("style");
  });
});
