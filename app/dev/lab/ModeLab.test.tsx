import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ModeLab } from "@/app/dev/lab/ModeLab";
import { fakeMarket } from "@/lib/data/market";
import { PRESET_MODES } from "@/lib/data/modes";
import { LAB_COLUMNS } from "@/lib/lab/columns";
import { runLab } from "@/lib/lab/run";
import { STRATEGIES } from "@/lib/lab/strategies";

afterEach(cleanup);

async function runWith(games: string, seed: string) {
  render(<ModeLab />);
  fireEvent.change(screen.getByLabelText("Games per bot"), { target: { value: games } });
  fireEvent.change(screen.getByLabelText("Seed"), { target: { value: seed } });
  fireEvent.click(screen.getByRole("button", { name: "Run the lab" }));
}

describe("ModeLab", () => {
  it("shows a prompt and no tables before the lab runs", () => {
    render(<ModeLab />);

    expect(screen.getByText("Press Run the lab to play the games in your browser.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("plays every mode and shows the same numbers as the script", async () => {
    await runWith("100", "7");

    await waitFor(() => expect(screen.getByText(/1,800 games in/)).toBeInTheDocument());
    expect(screen.getAllByRole("table")).toHaveLength(PRESET_MODES.length);

    const expected = runLab({
      modes: PRESET_MODES.map((mode) => ({ name: mode.name, config: mode.config })),
      strategies: STRATEGIES,
      market: fakeMarket,
      games: 100,
      seed: 7,
    });
    const classicTable = screen.getAllByRole("table")[0];
    const classicRows = within(classicTable).getAllByRole("row").slice(1);

    expect(classicRows).toHaveLength(STRATEGIES.length);
    classicRows.forEach((row, index) => {
      const cells = within(row).getAllByRole("cell").map((cell) => cell.textContent);
      expect(cells).toEqual(LAB_COLUMNS.map((column) => column.cell(expected[index])));
    });
  });

  it("rejects a seed that isn't a whole number and runs nothing", async () => {
    await runWith("100", "abc");

    expect(screen.getByText("Seed must be a whole number of at least 1.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run the lab" })).toBeEnabled();
  });
});
