# Game Mode Sandbox

Game Mode Sandbox is a frontend-only Next.js playground for trying different rule configurations of a stock market draft game. It uses fake companies, fake price history, and shared typed fixtures so multiple contributors can build in parallel against the same contract. This project intentionally has no server, no API calls, no database, no persistence, and no scoring yet.

## Getting started

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

All four must pass on every PR.

## Folder ownership

- Kenny: `app/` (except `app/dev`), `components/store/`, `lib/data/`
- Ethan: `lib/engine/`
- Jane: `components/game/`, `app/dev/`
- Shared (tiny separate PRs only): `lib/types.ts`, `lib/constants.ts`, `lib/random.ts`, `lib/fixtures.ts`

## Preset modes

- Classic Draft: 8 rounds, 5 stocks per round, one per industry, 10-year hold, equal split, no selling
- One Shot: 5 rounds, 1 stock per round, 5-year hold, set amounts 10-50%, no selling
- Budget Boss: 6 rounds, 8 per round (one per industry), hold until end, $500 minimum plus any amount, no selling
- Active Trader: 10 rounds, 10 per round, 3-year hold, $500 to $3,000 per pick, sell any stock
- Sector Swap: 8 rounds, 8 per round, one per industry, hold until end, set amounts 5-25%, sell but replace with same industry
- Sector Focus: 8 rounds, 5 per round all from one industry, 5-year hold, equal split, no selling

## Custom Mode

Custom Mode lets you set every rule yourself, and the settings are shared through the URL.