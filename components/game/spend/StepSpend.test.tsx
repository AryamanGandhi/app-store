import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { sampleSpendSteps } from "@/lib/fixtures";
import { StepSpend } from "@/components/game/spend/StepSpend";

// The project's vitest config does not enable global hooks, so RTL's
// automatic afterEach cleanup never registers. Register it per-file so
// multi-render test files don't accumulate DOM between tests.
afterEach(cleanup);

describe("StepSpend", () => {
  it("renders one button per step", () => {
    render(<StepSpend options={sampleSpendSteps} accentColor="#2563eb" onAmountChange={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(sampleSpendSteps.steps.length);
  });

  it("greys out and disables steps that are not enabled", () => {
    render(<StepSpend options={sampleSpendSteps} accentColor="#2563eb" onAmountChange={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    const disabledSteps = sampleSpendSteps.steps.filter((s) => !s.enabled);
    for (const step of disabledSteps) {
      const index = sampleSpendSteps.steps.indexOf(step);
      expect(buttons[index]).toBeDisabled();
    }
  });

  it("has nothing selected at first", () => {
    const onAmountChange = vi.fn();
    render(<StepSpend options={sampleSpendSteps} accentColor="#2563eb" onAmountChange={onAmountChange} />);

    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
    expect(onAmountChange).toHaveBeenLastCalledWith(0, false);
  });

  it("selects an enabled step when tapped and reports its amount", () => {
    const onAmountChange = vi.fn();
    render(<StepSpend options={sampleSpendSteps} accentColor="#2563eb" onAmountChange={onAmountChange} />);

    const first = sampleSpendSteps.steps[0];
    const firstButton = screen.getAllByRole("button")[0];
    fireEvent.click(firstButton);

    expect(firstButton).toHaveAttribute("aria-pressed", "true");
    expect(onAmountChange).toHaveBeenLastCalledWith(first.amount, true);
  });

  it("does not select a disabled step when tapped", () => {
    const onAmountChange = vi.fn();
    render(<StepSpend options={sampleSpendSteps} accentColor="#2563eb" onAmountChange={onAmountChange} />);

    const buttons = screen.getAllByRole("button");
    const disabled = sampleSpendSteps.steps.find((s) => !s.enabled)!;
    const disabledIndex = sampleSpendSteps.steps.indexOf(disabled);
    const disabledButton = buttons[disabledIndex];
    fireEvent.click(disabledButton);

    expect(disabledButton).toHaveAttribute("aria-pressed", "false");
    expect(onAmountChange).not.toHaveBeenCalledWith(disabled.amount, true);
  });
});
