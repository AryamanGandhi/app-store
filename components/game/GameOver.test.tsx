import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { sampleMarket, sampleStateGameOver } from "@/lib/fixtures";
import { formatMoney, formatPercentChange } from "@/components/game/format";
import { GameOver } from "@/components/game/GameOver";
import type { FinalHolding } from "@/components/game/GameOver";

// The project's vitest config does not enable global hooks, so RTL's
// automatic afterEach cleanup never registers. Register it per-file so
// multi-render test files don't accumulate DOM between tests.
afterEach(cleanup);

const accentColor = "#2563eb";
const modeName = "Classic Draft";
const noop = () => {};

// Final values are shares times the last year's price, the same maths the page uses.
const buildFinalHoldings = (): FinalHolding[] =>
  sampleStateGameOver.holdings.map((holding) => ({
    holding,
    finalValue:
      Math.round(holding.shares * sampleMarket.prices[holding.ticker][sampleStateGameOver.year] * 100) /
      100,
  }));

describe("GameOver", () => {
  it("shows the heading, the mode name and leftover cash", () => {
    render(
      <GameOver
        modeName={modeName}
        holdings={[]}
        cash={250}
        accentColor={accentColor}
        onPlayAgain={noop}
        onBackToStore={noop}
      />,
    );

    expect(screen.getByRole("heading", { name: "Game over" })).toBeInTheDocument();
    expect(screen.getByText(modeName)).toBeInTheDocument();
    expect(screen.getByText("Leftover cash")).toBeInTheDocument();
    expect(screen.getByText(formatMoney(250))).toBeInTheDocument();
  });

  it("shows every final holding with its final value and percent change", () => {
    const holdings = buildFinalHoldings();

    render(
      <GameOver
        modeName={modeName}
        holdings={holdings}
        cash={sampleStateGameOver.cash}
        accentColor={accentColor}
        onPlayAgain={noop}
        onBackToStore={noop}
      />,
    );

    expect(holdings).toHaveLength(8);

    for (const { holding, finalValue } of holdings) {
      const row = screen.getByRole("heading", { name: holding.name }).closest("li")!;

      expect(within(row).getByText(holding.industry)).toBeInTheDocument();
      expect(within(row).getByText(formatMoney(finalValue))).toBeInTheDocument();
      expect(
        within(row).getByText(formatPercentChange(finalValue, holding.amountSpent)),
      ).toBeInTheDocument();
    }
  });

  it("colours the final change green when up, red when down and slate when even", () => {
    const [first, second, third] = sampleStateGameOver.holdings;
    const holdings: FinalHolding[] = [
      { holding: first, finalValue: first.amountSpent + 500 },
      { holding: second, finalValue: second.amountSpent - 500 },
      { holding: third, finalValue: third.amountSpent },
    ];

    render(
      <GameOver
        modeName={modeName}
        holdings={holdings}
        cash={250}
        accentColor={accentColor}
        onPlayAgain={noop}
        onBackToStore={noop}
      />,
    );

    expect(
      screen.getByText(formatPercentChange(first.amountSpent + 500, first.amountSpent)),
    ).toHaveClass("text-green-600");
    expect(
      screen.getByText(formatPercentChange(second.amountSpent - 500, second.amountSpent)),
    ).toHaveClass("text-red-600");
    expect(screen.getByText(formatPercentChange(third.amountSpent, third.amountSpent))).toHaveClass(
      "text-slate-600",
    );
  });

  it("calls onPlayAgain and onBackToStore when the buttons are tapped", () => {
    const onPlayAgain = vi.fn();
    const onBackToStore = vi.fn();

    render(
      <GameOver
        modeName={modeName}
        holdings={buildFinalHoldings()}
        cash={250}
        accentColor={accentColor}
        onPlayAgain={onPlayAgain}
        onBackToStore={onBackToStore}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play again" }));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    expect(onBackToStore).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Back to store" }));
    expect(onBackToStore).toHaveBeenCalledTimes(1);
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it("shows no score, rank or total of any kind", () => {
    render(
      <GameOver
        modeName={modeName}
        holdings={buildFinalHoldings()}
        cash={sampleStateGameOver.cash}
        accentColor={accentColor}
        onPlayAgain={noop}
        onBackToStore={noop}
      />,
    );

    expect(screen.queryByText(/score|rank|total/i)).not.toBeInTheDocument();
  });
});
