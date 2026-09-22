import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The project's vitest config does not enable global hooks, so RTL's
// automatic afterEach cleanup never registers. Register it per-file so
// multi-render test files don't accumulate DOM between tests.
afterEach(cleanup);

import { StockCard } from "@/components/game/StockCard";
import { formatMoney } from "@/components/game/format";
import { sampleStateBlocked, sampleStateRound1 } from "@/lib/fixtures";

const accentColor = "#2563eb";
const pickableEntry = sampleStateRound1.board[0];
const blockedEntry = sampleStateBlocked.board[0];

describe("StockCard", () => {
  it("renders the ticker, company name, industry, and price", () => {
    render(
      <StockCard
        entry={pickableEntry}
        selected={false}
        accentColor={accentColor}
        hideIndustry={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText(pickableEntry.stock.ticker)).toBeInTheDocument();
    expect(screen.getByText(pickableEntry.stock.name)).toBeInTheDocument();
    expect(screen.getByText(pickableEntry.stock.industry)).toBeInTheDocument();
    expect(screen.getByText(formatMoney(pickableEntry.price))).toBeInTheDocument();
  });

  it("hides the industry tag when hideIndustry is true", () => {
    render(
      <StockCard
        entry={pickableEntry}
        selected={false}
        accentColor={accentColor}
        hideIndustry
        onSelect={vi.fn()}
      />,
    );

    expect(screen.queryByText(pickableEntry.stock.industry)).not.toBeInTheDocument();
  });

  it("uses the selected look and aria-pressed when selected", () => {
    render(
      <StockCard
        entry={pickableEntry}
        selected
        accentColor={accentColor}
        hideIndustry={false}
        onSelect={vi.fn()}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveClass("border-2");
    expect(button).toHaveStyle({ borderColor: accentColor });
  });

  it("uses the normal look when not selected", () => {
    render(
      <StockCard
        entry={pickableEntry}
        selected={false}
        accentColor={accentColor}
        hideIndustry={false}
        onSelect={vi.fn()}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).not.toHaveClass("border-2");
    expect(button).not.toHaveStyle({ borderColor: accentColor });
  });

  it("greys out a not-pickable card, shows its reason, and blocks selection", () => {
    const onSelect = vi.fn();
    render(
      <StockCard
        entry={blockedEntry}
        selected={false}
        accentColor={accentColor}
        hideIndustry={false}
        onSelect={onSelect}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("opacity-60");
    expect(screen.getByText(blockedEntry.reason as string)).toBeInTheDocument();
    fireEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("calls onSelect with the ticker when a pickable card is tapped", () => {
    const onSelect = vi.fn();
    render(
      <StockCard
        entry={pickableEntry}
        selected={false}
        accentColor={accentColor}
        hideIndustry={false}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(pickableEntry.stock.ticker);
  });
});
