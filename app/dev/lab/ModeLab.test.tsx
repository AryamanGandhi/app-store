import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ModeLab } from "@/app/dev/lab/ModeLab";
import { fakeMarket } from "@/lib/data/market";
import { PRESET_MODES } from "@/lib/data/modes";
import { LAB_COLUMNS, SKILL_COLUMNS } from "@/lib/lab/columns";
import { runLab } from "@/lib/lab/run";
import { roomForSkill } from "@/lib/lab/skill";
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

    // A few thousand real games take about a second locally and longer on CI, past waitFor's 1s default.
    const totalGames = (100 * PRESET_MODES.length * STRATEGIES.length).toLocaleString("en-US");
    await waitFor(() => expect(screen.getByText(new RegExp(`${totalGames} games in`))).toBeInTheDocument(), { timeout: 10000 });
    // One table per mode, plus the Room for skill table at the end.
    expect(screen.getAllByRole("table")).toHaveLength(PRESET_MODES.length + 1);

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
  }, 20000);

  it("shows the Room for skill table only after the run, with the same cells as the script", async () => {
    await runWith("100", "7");

    // Mid-run, after at least one whole mode has finished, the table must still be hidden.
    let midRunChecks = 0;
    while (!screen.queryByText(/ games in /)) {
      const done = Number(/Played (\d+) of/.exec(document.body.textContent ?? "")?.[1] ?? 0);
      if (done >= STRATEGIES.length) {
        expect(screen.queryByRole("region", { name: "Room for skill" })).not.toBeInTheDocument();
        midRunChecks += 1;
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(midRunChecks).toBeGreaterThan(0);

    const totalGames = (100 * PRESET_MODES.length * STRATEGIES.length).toLocaleString("en-US");
    await waitFor(() => expect(screen.getByText(new RegExp(`${totalGames} games in`))).toBeInTheDocument(), { timeout: 10000 });

    const expected = roomForSkill(runLab({
      modes: PRESET_MODES.map((mode) => ({ name: mode.name, config: mode.config })),
      strategies: STRATEGIES,
      market: fakeMarket,
      games: 100,
      seed: 7,
    }), STRATEGIES);
    const skillTable = within(screen.getByRole("region", { name: "Room for skill" })).getByRole("table");
    const skillRows = within(skillTable).getAllByRole("row").slice(1);

    expect(skillRows).toHaveLength(expected.length);
    skillRows.forEach((row, index) => {
      const cells = within(row).getAllByRole("cell").map((cell) => cell.textContent);
      expect(cells).toEqual(SKILL_COLUMNS.map((column) => column.cell(expected[index])));
    });
  }, 20000);

  it("rejects a seed that isn't a whole number and runs nothing", async () => {
    await runWith("100", "abc");

    expect(screen.getByText("Seed must be a whole number of at least 1.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run the lab" })).toBeEnabled();
  });
});
