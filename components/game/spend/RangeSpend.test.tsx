import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { sampleSpendRange } from "@/lib/fixtures";
import { formatMoney } from "@/components/game/format";
import { RangeSpend } from "@/components/game/spend/RangeSpend";

// The project's vitest config does not enable global hooks, so RTL's
// automatic afterEach cleanup never registers. Register it per-file so
// multi-render test files don't accumulate DOM between tests.
afterEach(cleanup);

describe("RangeSpend", () => {
  it("starts at min and shows the amount large", () => {
    render(<RangeSpend options={sampleSpendRange} accentColor="#2563eb" onAmountChange={vi.fn()} />);

    expect(screen.getByText(formatMoney(sampleSpendRange.min))).toBeInTheDocument();
  });

  it("plus and minus move the amount by 100 and clamp to the bounds", () => {
    const onAmountChange = vi.fn();
    render(<RangeSpend options={sampleSpendRange} accentColor="#2563eb" onAmountChange={onAmountChange} />);

    const minus = screen.getByRole("button", { name: /decrease amount/i });
    const plus = screen.getByRole("button", { name: /increase amount/i });

    // Already at min: pressing minus stays at min.
    fireEvent.click(minus);
    expect(onAmountChange).toHaveBeenLastCalledWith(sampleSpendRange.min, true);

    // Pressing plus climbs by 100.
    fireEvent.click(plus);
    expect(onAmountChange).toHaveBeenLastCalledWith(sampleSpendRange.min + 100, true);
  });

  it("plus can reach a max that is not a multiple of 100", () => {
    const options = { ...sampleSpendRange, min: 500, max: 2950, reserved: 0 };
    const onAmountChange = vi.fn();
    render(<RangeSpend options={options} accentColor="#2563eb" onAmountChange={onAmountChange} />);

    const plus = screen.getByRole("button", { name: /increase amount/i });
    for (let i = 0; i < 25; i++) {
      fireEvent.click(plus);
    }
    expect(onAmountChange).toHaveBeenLastCalledWith(2950, true);
    // Stays clamped at max.
    fireEvent.click(plus);
    expect(onAmountChange).toHaveBeenLastCalledWith(2950, true);
  });

  it("the slider updates the amount", () => {
    const onAmountChange = vi.fn();
    render(<RangeSpend options={sampleSpendRange} accentColor="#2563eb" onAmountChange={onAmountChange} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: String(sampleSpendRange.max) } });
    expect(onAmountChange).toHaveBeenLastCalledWith(sampleSpendRange.max, true);
  });

  it("shows the reserved helper text when reserved > 0", () => {
    render(<RangeSpend options={sampleSpendRange} accentColor="#2563eb" onAmountChange={vi.fn()} />);
    expect(
      screen.getByText(`Keeping ${formatMoney(sampleSpendRange.reserved)} for your remaining picks.`),
    ).toBeInTheDocument();
  });
});
