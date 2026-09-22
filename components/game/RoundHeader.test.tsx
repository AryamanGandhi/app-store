import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

// The project's vitest config does not enable global hooks, so RTL's
// automatic afterEach cleanup never registers. Register it per-file so
// multi-render test files don't accumulate DOM between tests.
afterEach(cleanup);

import { RoundHeader } from "@/components/game/RoundHeader";

const props = {
  modeName: "Classic Draft",
  round: 1,
  totalRounds: 8,
  year: 2002,
  cash: 10000,
  accentColor: "#2563eb",
};

describe("RoundHeader", () => {
  it("renders the mode name, round, year, and cash left", () => {
    render(<RoundHeader {...props} />);

    expect(screen.getByText("Classic Draft")).toBeInTheDocument();
    expect(screen.getByText(/Round 1 of 8/)).toBeInTheDocument();
    expect(screen.getByText(/Year 2002/)).toBeInTheDocument();
    expect(screen.getByText("$10,000")).toBeInTheDocument();
  });

  it("renders the industry notice when an industry is passed", () => {
    render(<RoundHeader {...props} industry="Consumer Discretionary" />);

    expect(screen.getByText("All Consumer Discretionary this round.")).toBeInTheDocument();
  });

  it("does not render the industry notice when industry is omitted", () => {
    render(<RoundHeader {...props} />);

    expect(screen.queryByText(/All .+ this round\./)).not.toBeInTheDocument();
  });
});
