import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConfigSummary } from "@/components/store/ConfigSummary";
import { configRows } from "@/components/store/config-labels";
import { PRESET_MODES } from "@/lib/data/modes";

describe("ConfigSummary", () => {
  it("renders every row label and value for a preset config", () => {
    const mode = PRESET_MODES[4];
    const rows = configRows(mode.config);

    render(<ConfigSummary config={mode.config} accentColor={mode.accentColor} />);

    expect(screen.getByRole("heading", { name: "At a glance" })).toBeInTheDocument();

    for (const row of rows) {
      expect(screen.getByText(row.label)).toBeInTheDocument();
      expect(screen.getAllByText(row.value).length).toBeGreaterThan(0);
    }
  });
});