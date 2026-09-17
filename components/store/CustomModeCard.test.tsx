import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CustomModeCard } from "@/components/store/CustomModeCard";

describe("CustomModeCard", () => {
  it("renders its content and links to the custom mode page", () => {
    render(<CustomModeCard />);

    expect(screen.getByRole("heading", { name: "Custom Mode" })).toBeInTheDocument();
    expect(screen.getByText("Pick every rule yourself.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /custom mode/i })).toHaveAttribute(
      "href",
      "/modes/custom",
    );
  });
});