import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { sampleStateMidGame } from "@/lib/fixtures";
import { formatMoney, formatPercentChange } from "@/components/game/format";
import { HoldingsPanel } from "@/components/game/HoldingsPanel";
import type { HoldingItem } from "@/components/game/HoldingsPanel";

// The project's vitest config does not enable global hooks, so RTL's
// automatic afterEach cleanup never registers. Register it per-file so
// multi-render test files don't accumulate DOM between tests.
afterEach(cleanup);

const accentColor = "#2563eb";
const allowed = { allowed: true, reason: null };

const buildItems = (values: number[]): HoldingItem[] =>
  sampleStateMidGame.holdings.map((holding, index) => ({
    holding,
    value: values[index],
    sellCheck: allowed,
  }));

describe("HoldingsPanel", () => {
  it("renders every field of a holding", () => {
    const holding = sampleStateMidGame.holdings[0];

    render(
      <HoldingsPanel
        items={[{ holding, value: 1800, sellCheck: allowed }]}
        currentYear={2004}
        holdYears={3}
        sellingAllowed={true}
        accentColor={accentColor}
        onSell={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: holding.name })).toBeInTheDocument();
    expect(screen.getByText(holding.industry)).toBeInTheDocument();
    expect(
      screen.getByText(`Bought ${holding.yearBought} for ${formatMoney(holding.amountSpent)}`),
    ).toBeInTheDocument();
    expect(screen.getByText(formatMoney(1800))).toBeInTheDocument();
    expect(screen.getByText(formatPercentChange(1800, holding.amountSpent))).toBeInTheDocument();
  });

  it("colours the change green when up, red when down and slate when exactly even", () => {
    render(
      <HoldingsPanel
        items={buildItems([1800, 2000, 1750])}
        currentYear={2004}
        holdYears={3}
        sellingAllowed={false}
        accentColor={accentColor}
        onSell={vi.fn()}
      />,
    );

    const [up, down, even] = sampleStateMidGame.holdings;

    expect(screen.getByText(formatPercentChange(1800, up.amountSpent))).toHaveClass(
      "text-green-600",
    );
    expect(screen.getByText(formatPercentChange(2000, down.amountSpent))).toHaveClass(
      "text-red-600",
    );
    expect(screen.getByText(formatPercentChange(1750, even.amountSpent))).toHaveClass(
      "text-slate-600",
    );
  });

  it("shows the hold status for a fixed hold length", () => {
    render(
      <HoldingsPanel
        items={buildItems([1800, 2000, 1750])}
        currentYear={2004}
        holdYears={3}
        sellingAllowed={false}
        accentColor={accentColor}
        onSell={vi.fn()}
      />,
    );

    // Bought 2002 -> 1 year left, bought 2003 -> 2 years left.
    expect(screen.getByText("Sells in 1 year")).toBeInTheDocument();
    expect(screen.getByText("Sells in 2 years")).toBeInTheDocument();
  });

  it('shows "Held until end" when the hold length is indefinite', () => {
    render(
      <HoldingsPanel
        items={buildItems([1800, 2000, 1750])}
        currentYear={2015}
        holdYears="indefinite"
        sellingAllowed={false}
        accentColor={accentColor}
        onSell={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Held until end")).toHaveLength(3);
    expect(screen.queryByText(/Sells in/)).not.toBeInTheDocument();
  });

  it("asks for confirmation before selling and calls onSell with the holding id", () => {
    const holding = sampleStateMidGame.holdings[0];
    const onSell = vi.fn();

    render(
      <HoldingsPanel
        items={[{ holding, value: 2210, sellCheck: allowed }]}
        currentYear={2004}
        holdYears={3}
        sellingAllowed={true}
        accentColor={accentColor}
        onSell={onSell}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: `Sell ${holding.name}` }));

    // Nothing is sold on the first tap, it only opens the confirmation.
    expect(onSell).not.toHaveBeenCalled();
    expect(screen.getByText(`Sell for ${formatMoney(2210)}?`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onSell).toHaveBeenCalledTimes(1);
    expect(onSell).toHaveBeenCalledWith(holding.id);
  });


  it("closes the confirmation without selling when Cancel is tapped", () => {
    const holding = sampleStateMidGame.holdings[0];
    const onSell = vi.fn();

    render(
      <HoldingsPanel
        items={[{ holding, value: 2210, sellCheck: allowed }]}
        currentYear={2004}
        holdYears={3}
        sellingAllowed={true}
        accentColor={accentColor}
        onSell={onSell}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: `Sell ${holding.name}` }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onSell).not.toHaveBeenCalled();
    expect(screen.queryByText(/Sell for/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Sell ${holding.name}` })).toBeInTheDocument();
  });

  it("greys out a blocked Sell button, shows the reason and never sells", () => {
    const holding = sampleStateMidGame.holdings[1];
    const reason = "You can only sell one stock per round.";
    const onSell = vi.fn();

    render(
      <HoldingsPanel
        items={[{ holding, value: 2210, sellCheck: { allowed: false, reason } }]}
        currentYear={2004}
        holdYears={3}
        sellingAllowed={true}
        accentColor={accentColor}
        onSell={onSell}
      />,
    );

    const sell = screen.getByRole("button", { name: `Sell ${holding.name}` });
    expect(sell).toBeDisabled();
    expect(screen.getByText(reason)).toBeInTheDocument();

    fireEvent.click(sell);
    expect(onSell).not.toHaveBeenCalled();
  });

  it("shows no Sell buttons at all when selling is not allowed", () => {
    render(
      <HoldingsPanel
        items={buildItems([1800, 2000, 1750])}
        currentYear={2004}
        holdYears={3}
        sellingAllowed={false}
        accentColor={accentColor}
        onSell={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a friendly empty state", () => {
    render(
      <HoldingsPanel
        items={[]}
        currentYear={2004}
        holdYears={3}
        sellingAllowed={true}
        accentColor={accentColor}
        onSell={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No stocks yet. Pick one from the board to get started."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not fix its own width or position, so it fits a sidebar or a phone sheet", () => {
    render(
      <HoldingsPanel
        items={buildItems([1800, 2000, 1750])}
        currentYear={2004}
        holdYears={3}
        sellingAllowed={false}
        accentColor={accentColor}
        onSell={vi.fn()}
      />,
    );

    const panel = screen.getByRole("region", { name: "Your stocks" });
    expect(panel.className).not.toMatch(/sticky|fixed|max-w-|absolute/);
  });

  it("confirms only the row that was tapped", () => {
    const items = buildItems([1800, 2000, 1750]);
    const first = items[0].holding;

    render(
      <HoldingsPanel
        items={items}
        currentYear={2004}
        holdYears={3}
        sellingAllowed={true}
        accentColor={accentColor}
        onSell={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: `Sell ${first.name}` }));

    const firstRow = screen.getByRole("heading", { name: first.name }).closest("li")!;
    const secondRow = screen.getByRole("heading", { name: items[1].holding.name }).closest("li")!;

    expect(within(firstRow).getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(within(secondRow).queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
  });
});

