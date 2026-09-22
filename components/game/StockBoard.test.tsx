import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The project's vitest config does not enable global hooks, so RTL's
// automatic afterEach cleanup never registers. Register it per-file so
// multi-render test files don't accumulate DOM between tests.
afterEach(cleanup);

import { StockBoard } from "@/components/game/StockBoard";
import {
  sampleStateBlocked,
  sampleStateMidGame,
  sampleStateReplace,
  sampleStateRound1,
  sampleStateSameIndustry,
} from "@/lib/fixtures";

const accentColor = "#2563eb";

const renderBoard = (overrides: Partial<
  React.ComponentProps<typeof StockBoard>
> = {}) =>
  render(
    <StockBoard
      entries={sampleStateRound1.board}
      selectedTicker={null}
      accentColor={accentColor}
      events={[]}
      canSkip
      skipBlockedReason={null}
      onSelect={vi.fn()}
      onSkip={vi.fn()}
      {...overrides}
    />,
  );

describe("StockBoard", () => {
  it("renders every stock's name and ticker and enables Skip", () => {
    renderBoard();

    for (const entry of sampleStateRound1.board) {
      expect(screen.getByText(entry.stock.name)).toBeInTheDocument();
      expect(screen.getByText(entry.stock.ticker)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Skip round" })).toBeEnabled();
  });

  it("hides the events area when there are no events", () => {
    renderBoard();

    expect(screen.queryByLabelText("Round events")).not.toBeInTheDocument();
  });

  it("renders the round events when present", () => {
    render(
      <StockBoard
        entries={sampleStateReplace.board}
        selectedTicker={null}
        accentColor={accentColor}
        events={sampleStateReplace.events}
        canSkip={false}
        skipBlockedReason="Replace your Energy stock first."
        onSelect={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    for (const event of sampleStateReplace.events) {
      expect(screen.getByText(event.message)).toBeInTheDocument();
    }
  });

  it("hides industry tags when two or more cards share one industry", () => {
    renderBoard({ entries: sampleStateSameIndustry.board });

    expect(screen.queryByText("Consumer Discretionary")).not.toBeInTheDocument();
  });

  it("shows the industry tag for a single-card board", () => {
    const one = sampleStateRound1.board.slice(0, 1);
    renderBoard({ entries: one });

    expect(screen.getByText(one[0].stock.industry)).toBeInTheDocument();
  });

  it("gives the selected card an accent border and aria-pressed", () => {
    const firstTicker = sampleStateRound1.board[0].stock.ticker;
    renderBoard({ selectedTicker: firstTicker });

    const card = screen.getByRole("button", {
      name: new RegExp(sampleStateRound1.board[0].stock.name),
    });
    expect(card).toHaveAttribute("aria-pressed", "true");
    expect(card).toHaveClass("border-2");
    expect(card).toHaveStyle({ borderColor: accentColor });
  });

  it("calls onSelect with the ticker when a card is tapped", () => {
    const onSelect = vi.fn();
    renderBoard({ onSelect });

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(sampleStateRound1.board[0].stock.name),
      }),
    );
    expect(onSelect).toHaveBeenCalledWith(sampleStateRound1.board[0].stock.ticker);
  });

  it("calls onSkip when Skip round is tapped", () => {
    const onSkip = vi.fn();
    renderBoard({ onSkip });

    fireEvent.click(screen.getByRole("button", { name: "Skip round" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("disables Skip and shows the reason when skipping is blocked", () => {
    const onSkip = vi.fn();
    render(
      <StockBoard
        entries={sampleStateReplace.board}
        selectedTicker={null}
        accentColor={accentColor}
        events={sampleStateReplace.events}
        canSkip={false}
        skipBlockedReason="Replace your Energy stock first."
        onSelect={vi.fn()}
        onSkip={onSkip}
      />,
    );

    const skip = screen.getByRole("button", { name: "Skip round" });
    expect(skip).toBeDisabled();
    expect(skip.parentElement).toHaveTextContent("Replace your Energy stock first.");
    fireEvent.click(skip);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("keeps a wide board usable (10 stocks)", () => {
    renderBoard({ entries: sampleStateMidGame.board, events: sampleStateMidGame.events });

    expect(screen.getByLabelText("Round events")).toBeInTheDocument();
    for (const entry of sampleStateMidGame.board) {
      expect(screen.getByText(entry.stock.name)).toBeInTheDocument();
    }
  });

  it("renders not-pickable cards from the blocked board", () => {
    renderBoard({ entries: sampleStateBlocked.board });

    expect(screen.getAllByRole("button")).toHaveLength(sampleStateBlocked.board.length + 1);
  });
});
