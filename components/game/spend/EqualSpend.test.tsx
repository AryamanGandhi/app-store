import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { sampleSpendEqual } from "@/lib/fixtures";
import { formatMoney } from "@/components/game/format";
import { EqualSpend } from "@/components/game/spend/EqualSpend";

// The project's vitest config does not enable global hooks, so RTL's
// automatic afterEach cleanup never registers. Register it per-file so
// multi-render test files don't accumulate DOM between tests.
afterEach(cleanup);

describe("EqualSpend", () => {
  it("shows the fixed amount and the helper text", () => {
    render(<EqualSpend options={sampleSpendEqual} accentColor="#2563eb" onAmountChange={vi.fn()} />);

    expect(
      screen.getByText(`This pick gets ${formatMoney(sampleSpendEqual.fixedAmount!)}.`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your cash is split evenly across your remaining picks\./i),
    ).toBeInTheDocument();
  });

  it("reports the fixed amount as valid immediately", () => {
    const onAmountChange = vi.fn();
    render(<EqualSpend options={sampleSpendEqual} accentColor="#2563eb" onAmountChange={onAmountChange} />);

    expect(onAmountChange).toHaveBeenCalledWith(sampleSpendEqual.fixedAmount, true);
  });
});
