import { describe, expect, it } from "vitest";
import { sameMovesLine, SKILL_COLUMNS, SKILL_NOTE } from "@/lib/lab/columns";
import type { SkillRow } from "@/lib/lab/skill";

const roomCell = (row: SkillRow) => SKILL_COLUMNS.find((column) => column.header === "Room for skill")!.cell(row);

describe("SKILL_COLUMNS", () => {
  it("signs the room for skill both ways", () => {
    expect(roomCell({ mode: "M", bestBots: ["A"], bestSimple: 11785, noteTaker: 13052, reachable: 1267, ceiling: 20939, gap: 9154 })).toBe("+$9,154");
    expect(roomCell({ mode: "M", bestBots: ["A"], bestSimple: 12000, noteTaker: 11000, reachable: -1000, ceiling: 11500, gap: -500 })).toBe("-$500");
  });
});

describe("sameMovesLine", () => {
  it("joins two bots with and, and three with commas then and", () => {
    expect(sameMovesLine(["Big spender", "Churner"], 1000)).toBe("Same moves in all 1,000 games: Big spender and Churner.");
    expect(sameMovesLine(["Big spender", "Penny pincher", "Churner"], 1000))
      .toBe("Same moves in all 1,000 games: Big spender, Penny pincher and Churner.");
  });
});


describe("skill columns", () => {
  const row: SkillRow = {
    mode: "Classic", bestBots: ["A", "B"], bestSimple: 11785, noteTaker: 13052,
    ceiling: 20939, gap: 9154, reachable: 1267,
  };
  const cell = (header: string, changes: Partial<SkillRow> = {}) =>
    SKILL_COLUMNS.find((column) => column.header === header)!.cell({ ...row, ...changes });

  it("shows the headers and all cells in order", () => {
    expect(SKILL_COLUMNS.map((column) => column.header)).toEqual([
      "Mode", "Best simple bot", "Best simple median", "Note taker median", "Hindsight median",
      "Room for skill", "Reachable skill", "Share reached",
    ]);
    expect(SKILL_COLUMNS.map((column) => column.cell(row))).toEqual([
      "Classic", "A, B", "$11,785", "$13,052", "$20,939", "+$9,154", "+$1,267", "14%",
    ]);
  });

  it("signs reachable skill and prints zero without a sign", () => {
    expect(cell("Reachable skill", { reachable: -500 })).toBe("-$500");
    expect(cell("Reachable skill", { reachable: 0 })).toBe("$0");
    expect(cell("Room for skill", { gap: 0 })).toBe("$0");
  });

  it("rounds shares and keeps negative and above-ceiling shares", () => {
    expect(cell("Share reached", { gap: 2000, reachable: -100 })).toBe("-5%");
    expect(cell("Share reached", { gap: 300, reachable: 100 })).toBe("33%");
    expect(cell("Share reached", { gap: 100, reachable: 125 })).toBe("125%");
    expect(cell("Share reached", { gap: 100, reachable: 0 })).toBe("0%");
  });

  it("shows n/a for zero or negative room", () => {
    expect(cell("Share reached", { gap: 0 })).toBe("n/a");
    expect(cell("Share reached", { gap: -500, reachable: -1000 })).toBe("n/a");
  });

  it("explains shown prices and reachable skill", () => {
    expect(SKILL_NOTE).toMatch(/Note taker[^.]*only[^.]*prices[^.]*shown/i);
    expect(SKILL_NOTE).toMatch(/Reachable skill[^.]*Note taker[^.]*median[^.]*minus[^.]*best simple bot[^.]*median/i);
  });
});
