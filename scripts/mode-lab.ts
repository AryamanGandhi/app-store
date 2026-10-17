// Plays every preset mode with every bot and prints what the rules did to them.
// Usage: npm run lab -- --games=1000 --seed=2024
// Compare a preset with one rule changed: npm run lab -- --compare=sector-swap --variant=swapNoSelling
import { fakeMarket } from "@/lib/data/market";
import { PRESET_MODES } from "@/lib/data/modes";
import { formatChange, LAB_COLUMNS, LAB_COMPARE_COLUMNS, LAB_NOTE, sameMovesLine, SKILL_COLUMNS, SKILL_NOTE } from "@/lib/lab/columns";
import { runComparison, runLab } from "@/lib/lab/run";
import { sameMoveGroups } from "@/lib/lab/same-moves";
import { roomForSkill } from "@/lib/lab/skill";
import { STRATEGIES } from "@/lib/lab/strategies";
import { getVariant, LAB_VARIANTS } from "@/lib/lab/variants";
import { printTable, readNumberFlag, readTextFlag } from "./cli";

const games = readNumberFlag("games", 1000);
const seed = readNumberFlag("seed", 2024);
const compareSlug = readTextFlag("compare");
if (compareSlug === null && readTextFlag("variant") !== null) {
  throw new Error("--variant only works with --compare, for example --compare=sector-swap --variant=swapNoSelling.");
}
const started = performance.now();

function printReport() {
  const rows = runLab({
    modes: PRESET_MODES.map((mode) => ({ name: mode.name, config: mode.config })),
    strategies: STRATEGIES,
    market: fakeMarket,
    games,
    seed,
  });

  for (const mode of PRESET_MODES) {
    console.log(`\n${mode.name} (${games.toLocaleString("en-US")} games per bot)`);
    const modeRows = rows.filter((row) => row.mode === mode.name);
    printTable(LAB_COLUMNS.map((column) => column.header), modeRows.map((row) => LAB_COLUMNS.map((column) => column.cell(row))));
    for (const group of sameMoveGroups(modeRows)) {
      console.log(sameMovesLine(group.bots, games));
    }
  }

  const skillRows = roomForSkill(rows, STRATEGIES);
  if (skillRows.length > 0) {
    console.log("\nRoom for skill (medians over the same games)");
    printTable(SKILL_COLUMNS.map((column) => column.header), skillRows.map((row) => SKILL_COLUMNS.map((column) => column.cell(row))));
    console.log(SKILL_NOTE);
  }

  return rows.length * games;
}

function printComparison(slug: string) {
  const baseModeIndex = PRESET_MODES.findIndex((mode) => mode.slug === slug);
  const variantId = readTextFlag("variant") ?? "";
  const variant = getVariant(slug, variantId);

  if (!variant) {
    const choices = LAB_VARIANTS.map((choice) => `--compare=${choice.baseSlug} --variant=${choice.id}`).join("\n  ");
    throw new Error(`No variant "${variantId}" for "${slug}". Choose one of:\n  ${choices}`);
  }

  const base = PRESET_MODES[baseModeIndex];
  const { base: baseRows, variant: variantRows } = runComparison({
    base: { name: base.name, config: base.config },
    variant: { name: variant.name, config: variant.change(base.config) },
    baseModeIndex,
    strategies: STRATEGIES,
    market: fakeMarket,
    games,
    seed,
  });

  console.log(`\n${base.name} vs ${variant.name} (the same ${games.toLocaleString("en-US")} games per bot)`);
  const lines = baseRows.flatMap((baseRow, index) => {
    const variantRow = variantRows[index];
    const cells = (row: typeof baseRow) => LAB_COMPARE_COLUMNS.map((column) => column.format(column.value(row)));
    const changes = LAB_COMPARE_COLUMNS.map((column) => formatChange(column.format, column.value(variantRow) - column.value(baseRow)));

    return [[baseRow.strategy, "Preset", ...cells(baseRow)], ["", "Variant", ...cells(variantRow)], ["", "Change", ...changes]];
  });
  printTable(["Bot", "Version", ...LAB_COMPARE_COLUMNS.map((column) => column.header)], lines);
  console.log("\nChange is the variant minus the preset. Blocked cards change in percentage points.");

  return baseRows.length * 2 * games;
}

const totalGames = compareSlug === null ? printReport() : printComparison(compareSlug);
const seconds = (performance.now() - started) / 1000;
console.log(`\n${totalGames.toLocaleString("en-US")} games in ${seconds.toFixed(1)}s, seed ${seed}.`);
console.log(LAB_NOTE);
