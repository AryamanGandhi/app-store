import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ConfigForm } from "@/components/store/ConfigForm";
import { PRESET_MODES } from "@/lib/data/modes";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("ConfigForm", () => {
  beforeEach(() => {
    cleanup();
    push.mockReset();
  });

  it("renders a section for all 7 settings", () => {
    render(<ConfigForm initialConfig={PRESET_MODES[0].config} />);

    expect(screen.getByRole("heading", { name: "Rounds" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stocks shown per round" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hold time" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Board" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Picks" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Money" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Selling" })).toBeInTheDocument();
  });

  it("updates which option is selected when tapped", () => {
    render(<ConfigForm initialConfig={PRESET_MODES[0].config} />);

    const roundsSection = screen.getAllByText("Rounds")[0].closest("section");

    if (roundsSection === null) {
      throw new Error("Rounds section not found");
    }

    const sixRounds = within(roundsSection).getByRole("button", { name: "6" });
    const eightRounds = within(roundsSection).getByRole("button", { name: "8" });

    fireEvent.click(sixRounds);

    expect(sixRounds).toHaveAttribute("aria-pressed", "true");
    expect(eightRounds).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the right extra inputs for each money kind", () => {
    const view = render(<ConfigForm initialConfig={PRESET_MODES[0].config} />);

    expect(view.getAllByText(/Your cash is split evenly across your remaining picks/i).length).toBeGreaterThan(0);

    fireEvent.click(view.getByRole("button", { name: "Set amounts" }));
    expect(view.getByRole("button", { name: "10% to 50%" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "5% to 25%" })).toBeInTheDocument();

    fireEvent.click(view.getByRole("button", { name: "A range" }));
    expect(view.getByLabelText("Minimum per pick")).toBeInTheDocument();
    expect(view.getByLabelText("Maximum per pick")).toBeInTheDocument();

    fireEvent.click(view.getByRole("button", { name: "Minimum plus extra" }));
    expect(view.getByLabelText("Minimum per pick")).toBeInTheDocument();
    expect(view.queryByLabelText("Maximum per pick")).not.toBeInTheDocument();
  });

  it("loads a preset's values when its button is tapped", () => {
    const view = render(<ConfigForm initialConfig={PRESET_MODES[0].config} />);

    fireEvent.click(view.getAllByRole("button", { name: "Active Trader" })[0]);

    const roundsSection = screen.getAllByText("Rounds")[0].closest("section");

    if (roundsSection === null) {
      throw new Error("Rounds section not found");
    }

    expect(within(roundsSection).getByRole("button", { name: "10" })).toHaveAttribute("aria-pressed", "true");
    expect(view.getByRole("button", { name: "Sell any stock" })).toHaveAttribute("aria-pressed", "true");
    expect(view.getByRole("button", { name: "A range" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows an impossible combination error and disables Start", () => {
    const view = render(<ConfigForm initialConfig={PRESET_MODES[0].config} />);

    const stocksSection = view.getAllByText("Stocks shown per round")[0].closest("section");

    if (stocksSection === null) {
      throw new Error("Stocks section not found");
    }

    fireEvent.click(within(stocksSection).getByRole("button", { name: "10" }));

    expect(
      view.getAllByText("There are only 8 industries, so a one-per-industry board can show at most 8 stocks.").length,
    ).toBeGreaterThan(0);
    expect(view.getAllByRole("button", { name: "Start" })[0]).toBeDisabled();
  });

  it("re-enables Start after fixing an impossible combination", () => {
    const view = render(<ConfigForm initialConfig={PRESET_MODES[0].config} />);

    const stocksSection = view.getAllByText("Stocks shown per round")[0].closest("section");

    if (stocksSection === null) {
      throw new Error("Stocks section not found");
    }

    fireEvent.click(within(stocksSection).getByRole("button", { name: "10" }));
    expect(view.getAllByRole("button", { name: "Start" })[0]).toBeDisabled();

    fireEvent.click(view.getAllByRole("button", { name: "Any industries" })[0]);

    expect(view.queryByText(/There are only 8 industries/)).not.toBeInTheDocument();
    expect(view.getAllByRole("button", { name: "Start" })[0]).toBeEnabled();
  });

  it("pushes the expected URL when Start is tapped", () => {
    const view = render(<ConfigForm initialConfig={PRESET_MODES[0].config} />);

    const startButton = view.getAllByRole("button", { name: "Start" })[0];

    fireEvent.click(startButton);

    expect(push).toHaveBeenCalledWith(
      "/play/custom?rounds=8&stocks=5&hold=10&board=onePerIndustry&picks=onePerIndustry&money=equal&sell=none",
    );
  });
});