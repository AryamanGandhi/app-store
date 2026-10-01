"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { fakeMarket } from "@/lib/data/market";
import { PRESET_MODES } from "@/lib/data/modes";
import { LAB_COLUMNS, LAB_NOTE } from "@/lib/lab/columns";
import { gameSeedsForMode, runLabRow, type LabRow } from "@/lib/lab/run";
import { STRATEGIES } from "@/lib/lab/strategies";

const GAME_COUNTS = [100, 1000, 5000];
const DEFAULT_SEED = 2024;

type Progress = { done: number; total: number };
type Summary = { games: number; seconds: number; seed: number };

// Waiting a tick between rows lets the browser paint progress instead of freezing until every game is done.
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

export function ModeLab() {
  const [games, setGames] = useState(1000);
  const [seedText, setSeedText] = useState(String(DEFAULT_SEED));
  const [rows, setRows] = useState<LabRow[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeRun = useRef(0);

  // Leaving the page bumps the run id so an unfinished run stops instead of setting state on an unmounted page.
  useEffect(() => {
    const runs = activeRun;
    return () => {
      runs.current += 1;
    };
  }, []);

  const handleRun = async () => {
    const seed = Number(seedText);
    if (!Number.isInteger(seed) || seed < 1) {
      setError("Seed must be a whole number of at least 1.");
      return;
    }

    const runId = activeRun.current + 1;
    activeRun.current = runId;
    const total = PRESET_MODES.length * STRATEGIES.length;
    const results: LabRow[] = [];
    const started = performance.now();
    setError(null);
    setRows([]);
    setSummary(null);
    setProgress({ done: 0, total });

    for (const [modeIndex, mode] of PRESET_MODES.entries()) {
      const seeds = gameSeedsForMode(seed, modeIndex, games);

      for (const strategy of STRATEGIES) {
        await nextTick();
        if (activeRun.current !== runId) {
          return;
        }

        results.push(runLabRow({ name: mode.name, config: mode.config }, strategy, fakeMarket, seeds));
        setRows([...results]);
        setProgress({ done: results.length, total });
      }
    }

    setProgress(null);
    setSummary({ games: total * games, seconds: (performance.now() - started) / 1000, seed });
  };

  const running = progress !== null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Link href="/dev" className="text-sm text-slate-600 underline">
        Back to the component gallery
      </Link>
      <h1 className="mb-2 mt-3 text-2xl font-semibold text-slate-900">Mode Lab</h1>
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Bots play every preset mode on the same seeded games, so you can see what each rule set does to the
        same player. This is a developer tool; nothing here is shown in the game.
      </p>

      <ul className="mb-6 space-y-1 text-sm text-slate-700">
        {STRATEGIES.map((strategy) => (
          <li key={strategy.name}>
            <span className="font-semibold">{strategy.name}:</span> {strategy.description}
          </li>
        ))}
      </ul>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="text-sm text-slate-700">
          Games per bot
          <select
            className="mt-1 block rounded border border-slate-300 bg-white px-2 py-1"
            value={games}
            disabled={running}
            onChange={(event) => setGames(Number(event.target.value))}
          >
            {GAME_COUNTS.map((count) => (
              <option key={count} value={count}>{count.toLocaleString("en-US")}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700">
          Seed
          <input
            className="mt-1 block w-32 rounded border border-slate-300 bg-white px-2 py-1"
            inputMode="numeric"
            value={seedText}
            disabled={running}
            onChange={(event) => setSeedText(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={running}
          onClick={handleRun}
        >
          {running ? "Running..." : "Run the lab"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {progress && (
        <p className="mb-4 text-sm text-slate-600">
          Played {progress.done} of {progress.total} mode and bot pairs...
        </p>
      )}
      {summary && (
        <p className="mb-4 text-sm text-slate-600">
          {summary.games.toLocaleString("en-US")} games in {summary.seconds.toFixed(1)}s, seed {summary.seed}. {LAB_NOTE}
        </p>
      )}
      {rows.length === 0 && !running && (
        <p className="text-sm text-slate-600">Press Run the lab to play the games in your browser.</p>
      )}

      {PRESET_MODES.map((mode) => {
        const modeRows = rows.filter((row) => row.mode === mode.name);
        if (modeRows.length === 0) {
          return null;
        }

        return (
          <section key={mode.slug} className="mb-8">
            <h2 className="mb-2 text-lg font-semibold" style={{ color: mode.accentColor }}>{mode.name}</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    {LAB_COLUMNS.map((column) => (
                      <th key={column.header} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modeRows.map((row) => (
                    <tr key={row.strategy} className="border-t border-slate-100">
                      {LAB_COLUMNS.map((column) => (
                        <td key={column.header} className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-900">
                          {column.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </main>
  );
}
