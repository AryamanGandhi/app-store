import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { sampleStateReplace } from "@/lib/fixtures";
import { ReplaceBanner } from "@/components/game/ReplaceBanner";

// The project's vitest config does not enable global hooks, so RTL's
// automatic afterEach cleanup never registers. Register it per-file so
// multi-render test files don't accumulate DOM between tests.
afterEach(cleanup);

describe("ReplaceBanner", () => {
  it("names the industry the player must replace", () => {
    const industry = sampleStateReplace.mustReplaceIndustry!;

    render(<ReplaceBanner industry={industry} accentColor="#2563eb" />);

    expect(
      screen.getByRole("heading", {
        name: `You sold your ${industry} stock. Pick a new ${industry} stock to finish this round.`,
      }),
    ).toBeInTheDocument();
  });

  it("uses the accent colour for the banner border", () => {
    const industry = sampleStateReplace.mustReplaceIndustry!;

    render(<ReplaceBanner industry={industry} accentColor="#2563eb" />);

    const banner = screen.getByRole("region", { name: "Replace stock notice" });
    expect(banner).toHaveStyle({ borderColor: "#2563eb" });
  });
});
