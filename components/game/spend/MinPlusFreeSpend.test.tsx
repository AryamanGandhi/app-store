import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { sampleSpendMinPlusFree } from "@/lib/fixtures";
import { formatMoney } from "@/components/game/format";
import { MinPlusFreeSpend } from "@/components/game/spend/MinPlusFreeSpend";

// The project's vitest config does not enable global hooks, so RTL's
// automatic afterEach cleanup never registers. Register it per-file so
// multi-render test files don't accumulate DOM between tests.
afterEach(cleanup);

describe("MinPlusFreeSpend", () => {
  const renderPanel = (onAmountChange = vi.fn()) =>
    render(
      <MinPlusFreeSpend
        options={sampleSpendMinPlusFree}
        startingBudget={10000}
        accentColor="#2563eb"
        onAmountChange={onAmountChange}
      />,
    );

  it("defaults to the dollar mode", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: "$" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows an inline minimum error and stays invalid below the minimum", () => {
    const onAmountChange = vi.fn();
    renderPanel(onAmountChange);

    const input = screen.getByLabelText(/Dollar amount/i);
    fireEvent.change(input, { target: { value: "100" } });

    expect(
      screen.getByText(`The minimum is ${formatMoney(sampleSpendMinPlusFree.min)}.`),
    ).toBeInTheDocument();
    expect(onAmountChange).toHaveBeenLastCalledWith(100, false);
  });

  it("shows an inline maximum error and stays invalid above the maximum", () => {
    renderPanel();

    const input = screen.getByLabelText(/Dollar amount/i);
    fireEvent.change(input, { target: { value: String(sampleSpendMinPlusFree.max + 1000) } });

    expect(
      screen.getByText(`The most you can spend is ${formatMoney(sampleSpendMinPlusFree.max)}.`),
    ).toBeInTheDocument();
  });

  it("is invalid with no error text when the input is empty", () => {
    const onAmountChange = vi.fn();
    renderPanel(onAmountChange);

    const input = screen.getByLabelText(/Dollar amount/i);
    fireEvent.change(input, { target: { value: "" } });

    expect(screen.queryByText(/The (minimum|most)/i)).not.toBeInTheDocument();
    expect(onAmountChange).toHaveBeenLastCalledWith(0, false);
  });

  it("switches to percent and shows the dollar value under the input", () => {
    const onAmountChange = vi.fn();
    renderPanel(onAmountChange);

    fireEvent.click(screen.getByRole("button", { name: "%" }));
    const input = screen.getByLabelText(/Percent of budget/i);
    fireEvent.change(input, { target: { value: "50" } });

    expect(screen.getByText(formatMoney(5000))).toBeInTheDocument();
    expect(onAmountChange).toHaveBeenLastCalledWith(5000, true);
  });

  it("shows the reserved helper text only when reserved > 0", () => {
    render(
      <MinPlusFreeSpend
        options={sampleSpendMinPlusFree}
        startingBudget={10000}
        accentColor="#2563eb"
        onAmountChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(
        `Keeping ${formatMoney(sampleSpendMinPlusFree.reserved)} for your remaining picks.`,
      ),
    ).toBeInTheDocument();

    cleanup();

    render(
      <MinPlusFreeSpend
        options={{ ...sampleSpendMinPlusFree, reserved: 0 }}
        startingBudget={10000}
        accentColor="#2563eb"
        onAmountChange={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Keeping .* for your remaining picks\./i)).not.toBeInTheDocument();
  });
});
