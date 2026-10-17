import { describe, expect, it } from "vitest";
import { SKILL_COLUMNS } from "@/lib/lab/columns";
import type { SkillRow } from "@/lib/lab/skill";

const roomCell = (row: SkillRow) => SKILL_COLUMNS.find((column) => column.header === "Room for skill")!.cell(row);

describe("SKILL_COLUMNS", () => {
  it("signs the room for skill both ways", () => {
    expect(roomCell({ mode: "M", bestBots: ["A"], bestHonest: 11785, ceiling: 20939, gap: 9154 })).toBe("+$9,154");
    expect(roomCell({ mode: "M", bestBots: ["A"], bestHonest: 12000, ceiling: 11500, gap: -500 })).toBe("-$500");
  });
});
