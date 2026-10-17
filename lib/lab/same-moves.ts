import type { LabRow } from "@/lib/lab/run";

// Bots in one mode that made exactly the same moves in every game. Equal averages alone could be a coincidence.
export function sameMoveGroups(rows: LabRow[]): { mode: string; bots: string[] }[] {
  const modes = [...new Set(rows.map((row) => row.mode))];
  const groups: { mode: string; bots: string[] }[] = [];

  for (const mode of modes) {
    const modeGroups: LabRow[][] = [];
    for (const row of rows.filter((candidate) => candidate.mode === mode)) {
      const match = modeGroups.find((group) => group[0].games === row.games && group[0].movesKey === row.movesKey);
      if (match) {
        match.push(row);
      } else {
        modeGroups.push([row]);
      }
    }

    for (const group of modeGroups.filter((candidate) => candidate.length >= 2)) {
      groups.push({ mode, bots: group.map((row) => row.strategy) });
    }
  }

  return groups;
}
