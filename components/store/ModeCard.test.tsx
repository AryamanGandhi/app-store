import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModeCard } from "@/components/store/ModeCard";
import { PRESET_MODES } from "@/lib/data/modes";

describe("ModeCard", () => {
  it("renders the mode name, tagline, tags, and link", () => {
    const mode = PRESET_MODES[0];

    render(<ModeCard mode={mode} />);

    expect(screen.getByRole("heading", { name: mode.name })).toBeInTheDocument();
    expect(screen.getByText(mode.tagline)).toBeInTheDocument();

    for (const tag of mode.tags) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }

    expect(screen.getByRole("link", { name: new RegExp(mode.name, "i") })).toHaveAttribute(
      "href",
      `/modes/${mode.slug}`,
    );
  });
});