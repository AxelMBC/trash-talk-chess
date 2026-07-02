## Context

The app is a client-only Vite/React SPA with two screens (`MainMenu`, `GameScreen`) toggled by a `ScreenName` state in `App.tsx`. Step 1 (local pass-and-play chess) is complete. This change adds the data pipeline for the app's core premise: pulling a player's chess.com history and distilling it into a **player dossier** that a future trash-talk engine will consume, plus a scouting report screen that shows it off.

The chess.com published-data API (`https://api.chess.com/pub/...`) is free, keyless, and CORS-enabled, so everything in this change runs in the browser. Relevant endpoints:

- `GET /pub/player/{username}` — profile: `joined` (epoch seconds), `last_online`, `status`, avatar. Returns 404 for unknown users.
- `GET /pub/player/{username}/stats` — per time control (`chess_rapid`, `chess_blitz`, `chess_bullet`, `chess_daily`): `last.rating`, `best.rating`, `record: {win, loss, draw}`.
- `GET /pub/player/{username}/games/archives` — list of monthly archive URLs, oldest → newest.
- `GET /pub/player/{username}/games/{YYYY}/{MM}` — full games for that month with `pgn`, `time_control`, `rated`, `accuracies?`, and per-side `result` codes (`win`, `checkmated`, `resigned`, `timeout`, `abandoned`, `agreed`, `stalemate`, ...), ordered by end time ascending.

## Goals / Non-Goals

**Goals:**
- Fetch profile, stats, and the **last 100 games** for a given username, with polite serial pacing and typed errors.
- Derive a two-depth `PlayerDossier`: deep analysis of the last 100 games + light career-wide memory (account age, lifetime games, current vs. best ratings) — the career layer enables long-horizon jabs ("ten years and still under 1000?") without downloading the full archive history.
- Cache the dossier in `localStorage` per username with an explicit re-scout action.
- New scouting report screen with loading progress and static roast copy.

**Non-Goals:**
- No LLM / serverless function yet. (When it arrives in a later change, the recommendation is a **Vercel serverless function** — the Vite SPA deploys to Vercel as static assets and `api/` functions live in the same repo and domain, keeping the LLM API key server-side with zero CORS or infra ceremony. Nothing in this change depends on that choice.)
- No AI opponent, no changes to the existing local game.
- No move-by-move engine analysis of fetched games (blunder detection etc. would need Stockfish; out of scope).
- No chess.com OAuth/login — public data only.

## Decisions

**1. Career "light memory" comes from profile + stats endpoints only — never the full archive list.**
Account age (`joined`), lifetime game counts (sum of `record` across time controls), and current/best ratings are all available from two cheap requests. Downloading a 10-year player's ~120 monthly archives just for career flavor would be slow and rude. Trade-off: no career-wide opening history — acceptable, the last 100 games cover style.

**2. Last-100 collection walks archives newest → oldest, serially.**
Fetch the archive URL list, then request monthly archives one at a time from the most recent, taking games from the end of each month's (ascending-ordered) list until 100 are collected or archives run out. Serial requests follow chess.com's API guidance (parallel requests risk blocking); an active player needs only 1–4 months. Progress is reported per archive fetched so the UI can show it.

**3. Opening detection via PGN header extraction, not full PGN replay.**
chess.com PGNs carry `[ECO "..."]` and `[ECOUrl "https://www.chess.com/openings/<slug>"]` headers. A small regex pulls these; the human-readable opening name is derived from the ECOUrl slug. No new dependency, no need to `chess.js`-load 100 PGNs. `chess.js` remains available if a later change needs move-level analysis.

**4. Dossier is a versioned, serializable contract.**
`PlayerDossier` (in `src/types/dossier.types.ts`) carries `schemaVersion`, `username`, `fetchedAt`, `career: CareerSummary`, `recent: RecentGamesAnalysis`. It must stay plain-JSON serializable because (a) it lives in localStorage and (b) it will later be embedded verbatim into the LLM prompt. `schemaVersion` lets the cache be invalidated when derivation logic changes.

**5. localStorage keying and refresh policy: cache-first, manual re-scout.**
Key: `ttc:dossier:<lowercased-username>`. On lookup, a cached dossier renders immediately (no network); the report screen shows "scouted <relative time> ago" with a re-scout button that refetches and overwrites. No TTL/auto-expiry — simplest policy, and stale data is itself roastable. Mismatched `schemaVersion` is treated as a cache miss.

**6. Code layout: new `src/services/` directory.**
`src/services/chesscom.ts` (API client: typed fetch wrappers, error types, last-100 collector) and `src/services/dossier.ts` (pure derivation functions + localStorage cache). Derivation stays pure (raw data in → dossier out) so it's unit-testable and independent of React. A `useScoutingReport` hook bridges services to UI state (idle/loading-with-progress/ready/error), mirroring the `useChessGame` pattern of one hook owning one state object.

**7. UI flow: username field on `MainMenu`, new `scouting` screen.**
`ScreenName` gains `'scouting'`. MainMenu gets a username input + "Scout" action alongside the existing Local button. The `ScoutingReport` screen component (standard `ComponentName/` folder convention) renders dossier sections with static roast lines chosen by simple threshold rules (e.g. account age > 5y and rating < 1000 → the record-holder line). Roast copy lives in a plain data module so the future LLM change swaps the copy source, not the screen.

## Risks / Trade-offs

- [chess.com API shape drifts or rate-limits aggressively] → Typed error handling with a friendly failure state; serial pacing; all API parsing isolated in `chesscom.ts` so fixes are one-file.
- [Some games lack `accuracies` or ECO headers (bots, variants, older games)] → All derived fields are optional-tolerant; analysis skips what's missing rather than failing; variant games (non-standard rules) are filtered out by `rules === 'chess'`.
- [A brand-new account has few/no games or no stats for a time control] → Dossier builder handles < 100 games and absent time-control blocks; the report roasts the emptiness instead ("no games? scared?").
- [100 games of PGN text in localStorage would be heavy] → Only the derived dossier is persisted, not raw games/PGNs; the dossier is a few KB.
- [Static roast lines may feel repetitive] → Acceptable for this phase; copy is data-driven and gets replaced by the LLM change.

## Open Questions

- None blocking. Deployment target (Vercel) only becomes binding at the trash-talk-engine change.
