import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlayGame } from "@/app/play/PlayGame";
import { PRESET_MODES } from "@/lib/data/modes";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

afterEach(cleanup);

const classicMode = PRESET_MODES.find((mode) => mode.slug === "classic-draft")!;
const oneShotMode = PRESET_MODES.find((mode) => mode.slug === "one-shot")!;

async function waitForGameStart(mode = classicMode) {
  render(<PlayGame config={mode.config} modeName={mode.name} accentColor={mode.accentColor} />);

  await waitFor(() => {
    expect(screen.queryByText("Starting game...")).not.toBeInTheDocument();
  });
}

describe("PlayGame", () => {
  it("renders the round header and a board after the initial effect runs", async () => {
    await waitForGameStart();

    expect(screen.getByText(classicMode.name)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip round" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { pressed: false }).length).toBeGreaterThan(0);
  });

  it("shows the spend panel after selecting a stock", async () => {
    await waitForGameStart();

    const card = screen.getAllByRole("button", { pressed: false }).find((button) => {
      return button.getAttribute("aria-pressed") === "false" && button.textContent?.includes("$");
    });

    expect(card).toBeTruthy();
    fireEvent.click(card!);

    expect(screen.getByRole("button", { name: /Buy .* of /i })).toBeInTheDocument();
  });

  it("buying advances to the next round", async () => {
    await waitForGameStart();

    const card = screen.getAllByRole("button", { pressed: false }).find((button) => button.textContent?.includes("$"));
    fireEvent.click(card!);
    fireEvent.click(screen.getByRole("button", { name: /Buy .* of /i }));

    await waitFor(() => {
      expect(screen.getByText(/Round 2 of 8 • Year /)).toBeInTheDocument();
    });
  });

  it("skipping advances to the next round", async () => {
    await waitForGameStart();

    fireEvent.click(screen.getByRole("button", { name: "Skip round" }));

    await waitFor(() => {
      expect(screen.getByText(/Round 2 of 8 • Year /)).toBeInTheDocument();
    });
  });

  it("shows the game over screen after the last round", async () => {
    await waitForGameStart(oneShotMode);

    for (let index = 0; index < oneShotMode.config.rounds; index += 1) {
      const skip = screen.getByRole("button", { name: "Skip round" });
      fireEvent.click(skip);
    }

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Game over" })).toBeInTheDocument();
    });
  });

  it("a mode with no selling shows no sell buttons", async () => {
    await waitForGameStart();

    fireEvent.click(screen.getByRole("button", { name: "Your stocks (0)" }));

    expect(screen.queryByRole("button", { name: /^Sell /i })).not.toBeInTheDocument();
  });
});