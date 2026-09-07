# The League of Gentlemen — Fantasy Analytics

A dark-mode-first Next.js app for a fantasy football league, built around four
features: a live analytics dashboard, an advanced statistics module, a
10,000-trial Monte Carlo playoff simulator, and an interactive "what if"
playoff machine.

Runs out of the box on a deterministic **mock season** (no keys, no
network) or against a **real Sleeper league** by setting one env var.

```bash
npm install
npm run dev     # http://localhost:3100
```

---

## 1. Implementation plan

This is the order the app was actually built in, and the order to extend it
in:

1. **Domain model first** (`src/lib/types.ts`). Every feature — stats,
   simulation, live dashboard — reads and writes the same `League` /
   `Team` / `Roster` / `Matchup` shapes. Nothing downstream imports a
   platform-specific type, which is what makes step 6 below a one-file change.
2. **Mock data generator** (`src/lib/data/mockLeague.ts`) so the UI has
   something realistic to render immediately: a seeded 12-team, 2-division,
   14-week season with a round-robin schedule, per-team scoring talent, and
   a fully-rostered "live" current week.
3. **Core simulation logic** — the flagship deliverable:
   - `src/lib/simulation/tiebreakers.ts`: win% → head-to-head → points-for
     ranking, shared by every scenario resolver so seeding is computed the
     same way everywhere.
   - `src/lib/simulation/monteCarlo.ts`: fits a Normal(mean, stdDev) to each
     team's scoring history, then runs `trials` (default 10,000) independent
     simulations of the remaining schedule, tallying how often each team
     makes the playoffs / wins its division / earns a bye.
   - `src/lib/simulation/scenario.ts`: the same tiebreaker logic run once,
     deterministically, with user-chosen winners — this is the Playoff
     Machine's engine.
4. **Advanced stats** (`src/lib/stats/*`): All-Play record, Power Rankings,
   Luck Index, standings — all pure functions over the domain model.
5. **Live analytics logic** (`src/lib/optimalLineup.ts`,
   `src/lib/winProbability.ts`): an exact lineup optimizer and a
   normal-approximation live win probability model.
6. **Data source abstraction** (`src/lib/data/provider.ts`,
   `src/lib/espn/*`, `src/lib/sleeper/*`, `src/lib/cache.ts`): adapters that
   translate a real platform's API into the same `League` shape, behind a
   stale-while-revalidate cache. `provider.ts` checks ESPN, then Sleeper,
   then falls back to the mock season. Adding Yahoo means one more sibling
   adapter and one more branch in `provider.ts` — no other file changes.
7. **API routes** (`src/app/api/*/route.ts`) expose the above to the client.
8. **UI** — Tailwind + a small hand-rolled shadcn-style primitive set
   (`src/components/ui`), then one page per feature.

### Extending it (next steps toward production)

- **Real projections.** ESPN's API exposes pre-game projections directly
  (`statSourceId: 1`), so this is already live end-to-end when
  `ESPN_LEAGUE_ID` is set. Sleeper's free API has *no* projections endpoint
  (see the comment block at the top of `src/lib/sleeper/adapter.ts`) — if
  Sleeper becomes the primary provider again, wire a projections source in
  there; `optimalLineup.ts` / `winProbability.ts` already just consume
  `projectedPoints` and need no changes either way.
- **Distributed cache.** `src/lib/cache.ts` is an in-memory singleton — fine
  for one server instance, not for a multi-instance/serverless deployment.
  Swap its Map-backed store for Redis/Upstash behind the same
  `get`/`set`/`getOrFetchSWR` interface.
- **Push instead of poll.** The live dashboard polls `/api/live` on an
  interval (`NEXT_PUBLIC_LIVE_POLL_INTERVAL_MS`). A WebSocket or SSE channel
  fed by the same cache layer would cut latency and request volume further.
- **Dependency currency.** Pinned to Next.js 14.2.x (matching this
  monorepo's sibling app) rather than 15/16 to avoid an App Router breaking
  migration in this change; `npm audit` currently reports a few
  high-severity advisories in `next`'s transitive `postcss` that are only
  fully resolved by a Next 16 upgrade — worth scheduling deliberately rather
  than folded into this feature.
- **Tests.** The simulation/stats modules are pure functions with no I/O —
  ideal for unit tests (tiebreaker edge cases, all-play math, optimal-lineup
  correctness on hand-built rosters). None are included yet.

---

## 2. Feature → code map

| Feature | Where |
|---|---|
| Live Analytics Dashboard | `/live`, `src/components/dashboard/LiveDashboardClient.tsx`, `src/hooks/useLiveScores.ts`, `src/app/api/live` |
| Optimal lineup solver | `src/lib/optimalLineup.ts` |
| Live win probability | `src/lib/winProbability.ts` |
| All-Play Record | `src/lib/stats/allPlay.ts` |
| Power Rankings | `src/lib/stats/powerRankings.ts` |
| Luck Index | `src/lib/stats/luckIndex.ts` |
| Playoff Probability Simulator (Monte Carlo) | `src/lib/simulation/monteCarlo.ts`, `/simulator` |
| Interactive Playoff Machine | `src/lib/simulation/scenario.ts`, `/playoff-machine`, `src/store/usePlayoffMachineStore.ts` |
| Sleeper integration + cache | `src/lib/sleeper/*`, `src/lib/cache.ts`, `src/lib/data/provider.ts` |

---

## 3. Project structure

```
src/
├── app/
│   ├── layout.tsx              sidebar + header shell (dark mode)
│   ├── page.tsx                Overview dashboard
│   ├── live/page.tsx           Live Analytics Dashboard
│   ├── stats/page.tsx          Advanced Statistics (tabs)
│   ├── simulator/page.tsx      Playoff Probability Simulator
│   ├── playoff-machine/page.tsx  Interactive Playoff Machine
│   └── api/
│       ├── standings/route.ts  standings + all-play + power rankings + luck index
│       ├── simulate/route.ts   GET cached base sim, POST re-runs with overrides
│       └── live/route.ts       current-week matchups + optimal lineups + win prob
├── components/
│   ├── ui/                     button, card, badge, tabs, table, progress, switch, tooltip…
│   ├── layout/                 Sidebar, Header, MobileNav
│   ├── dashboard/               MatchupCard, WinProbabilityBar, StatCard, LiveDashboardClient
│   ├── stats/                  AllPlayTable, PowerRankingsChart/Table, LuckIndexChart/Table
│   ├── simulator/               PlayoffOddsChart/Table, SimulatorClient
│   └── playoff-machine/         MatchupToggle, StandingsPreview, PlayoffMachineClient
├── lib/
│   ├── types.ts                platform-agnostic domain model
│   ├── cache.ts                TTL + stale-while-revalidate + request coalescing
│   ├── random.ts                seeded PRNG, normal sampling/CDF
│   ├── optimalLineup.ts        exact lineup optimizer
│   ├── winProbability.ts       live win probability (normal approximation)
│   ├── liveView.ts             shared by /api/live and server components
│   ├── stats/                  allPlay.ts, powerRankings.ts, luckIndex.ts, standings.ts
│   ├── simulation/              monteCarlo.ts, tiebreakers.ts, scenario.ts
│   ├── espn/                     client.ts, adapter.ts, types.ts (primary — checked first)
│   ├── sleeper/                 client.ts, adapter.ts, types.ts (fallback if no ESPN league configured)
│   └── data/                    mockLeague.ts, provider.ts
├── hooks/useLiveScores.ts       polling hook (SWR-ish, no dependency)
└── store/usePlayoffMachineStore.ts   zustand store for manual overrides
```

---

## 4. Methodology notes

**All-Play Record** — for every completed week, compares each team's score
against every other team's score that week (as if the whole league played
each other), and tallies the resulting W/L/T. Schedule-independent.

**Power Rankings** — `35% Points For + 40% All-Play win% + 25% current
roster strength`, each min-max normalized 0–100 across the league so no
single dimension dominates by scale.

**Luck Index** — `actual wins − expected wins`, where expected wins is the
sum, week by week, of that week's All-Play win fraction. Positive means a
team is winning more than its scoring output would predict.

**Monte Carlo simulator** — fits `Normal(seasonMean, seasonStdDev)` to each
team (with a variance floor so a small sample size isn't mistaken for true
consistency), then for each of `trials` runs: samples every remaining
matchup, resolves final standings via wins → head-to-head → points-for,
seeds the bracket (division winners auto-qualify to the top seeds, best
remaining records fill wildcard slots, top-N seeds get a bye), and counts
outcomes. Odds are simply `count / trials` — accurate to roughly ±1
percentage point at n=10,000 for odds near 50%.

**Playoff Machine** — the same tiebreaker chain as the simulator, run once
deterministically: every remaining matchup not manually picked defaults to
the "chalk" pick (higher season-average team), so standings are always
fully resolved as you toggle games.

**Optimal lineup** — slots with single-position eligibility (QB/RB/WR/TE/
DST/K) can only be filled by that position, so the top-N players at each
position is provably optimal there; FLEX-type slots are filled greedily,
most-constrained-slot-first, which is exact for a single flex slot.

**Live win probability** — each starter's remaining point total is modeled
as `Normal(mean, variance)` (zero variance once a game is final); team
totals sum independent player distributions, and
`P(home wins) = P(homeTotal − awayTotal > 0)` via the resulting difference
distribution's CDF, clamped to `[1%, 99%]`.

---

## 5. Data sources

`src/lib/data/provider.ts` checks providers in this order:

1. **ESPN** — set `ESPN_LEAGUE_ID` (+ `ESPN_SEASON`) in `.env.local`. Public
   leagues need nothing else. **Private leagues** additionally need
   `ESPN_S2` and `ESPN_SWID` — cookies from a browser logged into
   fantasy.espn.com (DevTools → Application → Cookies →
   `fantasy.espn.com`). These act like a login session, not an API key:
   keep them in `.env.local` (already gitignored) and never commit or share
   them. Full detail in the header comment of `src/lib/espn/adapter.ts`.
2. **Sleeper** — set `SLEEPER_LEAGUE_ID` if you don't use ESPN. Sleeper's
   read API is public and keyless, no cookies needed.
3. **Mock** — if neither is set: a deterministic mock season (`SEED`-based,
   see `src/lib/data/mockLeague.ts`). No configuration needed, works fully
   offline.

Yahoo isn't wired up (it needs full OAuth app registration to prototype
against, unlike the above two) but the adapter boundary is designed so it
could be added as a third sibling — `lib/yahoo/adapter.ts` plus one more
branch in `provider.ts` — without touching stats/simulation/UI code.

**Note on ESPN's API:** it's undocumented/reverse-engineered (no official
public spec), and ESPN has changed response shapes across seasons before.
If something breaks against a real league, `src/lib/espn/types.ts` is the
one place to patch the shape, and `src/lib/espn/adapter.ts`'s header comment
documents the known gaps (unmapped IDP/superflex lineup slots are skipped
rather than crashing; there's no boolean "game is final" flag, so a
non-zero live score is used as a proxy for "in progress").

## 6. Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · a small hand-rolled
shadcn-style component set (Radix primitives + `class-variance-authority`)
· Recharts · Zustand · an in-memory stale-while-revalidate cache.
