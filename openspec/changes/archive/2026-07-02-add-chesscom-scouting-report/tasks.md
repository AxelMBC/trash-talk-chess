## 1. Types and API client

- [x] 1.1 Create `src/types/dossier.types.ts` with `PlayerDossier`, `CareerSummary`, `RecentGamesAnalysis` (plus supporting types: termination breakdown, opening stat, per-time-control rating block), including `schemaVersion`, `username`, `fetchedAt`
- [x] 1.2 Create `src/services/chesscom.ts` with typed response interfaces for profile, stats, archives list, and monthly games endpoints
- [x] 1.3 Implement typed error results in `chesscom.ts`: user-not-found (404), rate-limited (429), network/other — returned, not thrown
- [x] 1.4 Implement `fetchProfile` and `fetchStats` (tolerating absent time-control blocks)
- [x] 1.5 Implement `collectRecentGames(username, limit=100, onProgress)`: fetch archive list, walk newest → oldest serially, accumulate standard-rules (`rules === 'chess'`) games reverse-chronologically, stop at limit or exhaustion, fire progress per archive, and surface mid-collection failures as errors (never a truncated success)

## 2. Dossier derivation and cache

- [x] 2.1 Implement `buildCareerSummary(profile, stats)` in `src/services/dossier.ts`: account age from `joined`, lifetime games summed across records, current/best rating per time control — pure function, no fetching
- [x] 2.2 Implement PGN header extraction (regex for `ECO`/`ECOUrl`) and opening-name derivation from the ECOUrl slug
- [x] 2.3 Implement `buildRecentAnalysis(games, username)`: W/L/D from the player's perspective, win/loss termination breakdowns, top openings with counts, longest and current streaks, average accuracy (with sample count; absent when no data), most-played time control — tolerant of missing headers/accuracies
- [x] 2.4 Implement `buildDossier` assembling the versioned, plain-JSON-serializable `PlayerDossier`, handling sparse/empty accounts (< 100 games, zero games, missing stats blocks)
- [x] 2.5 Implement localStorage cache: `ttc:dossier:<lowercased-username>` key, cache-first read treating `schemaVersion` mismatch as a miss, and write/overwrite on build

## 3. Scouting flow hook

- [x] 3.1 Create `useScoutingReport` hook (`src/hooks/`) owning one state object: idle / loading (with archive progress) / ready (dossier + cache flag) / error (typed), following the `useChessGame` single-state-object pattern
- [x] 3.2 Wire the hook's `scout(username)` to check cache first (immediate ready, no network) and otherwise run fetch → build → persist; add `rescout()` that bypasses and overwrites the cache; guard against concurrent scouts

## 4. UI

- [x] 4.1 Add `'scouting'` to `ScreenName` and wire the screen switch in `App.tsx` (inside the existing `AnimatePresence` transition)
- [x] 4.2 Add username input + Scout action to `MainMenu` (disabled when empty/whitespace, Enter submits), navigating to the scouting screen
- [x] 4.3 Create `src/components/ScoutingReport/` (`ScoutingReport.tsx`, `.types.ts`, `index.ts`) rendering: career facts, recent-form stats (W/L/D, terminations, streaks, top openings, accuracy when present, preferred time control), "scouted X ago", re-scout button, back-to-menu
- [x] 4.4 Create the static roast-copy module (plain data + threshold rules over dossier values, e.g. account age > 5y and rating < 1000 → record-holder line; empty account → "no games? scared?" line) and render at least one matching line in the report
- [x] 4.5 Implement loading state with per-archive progress and disabled inputs, plus distinct recoverable error states (unknown user → edit and retry; network/rate-limit → retry button)

## 5. Verification

- [x] 5.1 `npm run lint` and `npm run build` pass
- [x] 5.2 Manual test with a real username (e.g. a long-time account and a low-game account): scout, verify report contents, verify cache hit renders instantly on second scout, verify re-scout refreshes `fetchedAt`
- [x] 5.3 Manual test error paths: gibberish username shows user-not-found with retry; offline (DevTools) shows network error with retry
- [x] 5.4 Verify dossier in localStorage is a few KB (no raw PGNs persisted) and survives a JSON round-trip
