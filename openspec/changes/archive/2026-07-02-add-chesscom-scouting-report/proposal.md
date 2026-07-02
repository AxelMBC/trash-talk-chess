## Why

The app's end goal is an AI opponent that trash-talks the player using their real chess.com history. Before building the AI opponent or the trash-talk engine, we need the data pipeline that feeds them: a way to look up a chess.com user, pull their public history, and distill it into a reusable "player dossier". Doing this first de-risks the core bet of the app (is the public data rich enough for personalized trash talk?) and delivers a fun, visible feature on its own — a scouting report screen that roasts the player before they've moved a piece.

## What Changes

- Add a chess.com API client for the free, keyless published-data API (`api.chess.com/pub/...`): player profile, stats, monthly game archives. Pure browser `fetch` — no backend needed for this phase.
- Add a dossier builder that derives trash-talk signals at two depths:
  - **Deep analysis of the last 100 games**: openings played (from PGN), win/loss/draw split, how games end (checkmate, resignation, timeout, abandonment), streaks, accuracy scores when present, time-control preference.
  - **Light career memory across the whole account**: account age, total games played, current vs. best ratings per time control — enough to fuel long-horizon jabs (e.g. "ten years on this site and still under 1000 — that has to be a record").
- Cache the dossier in `localStorage` keyed by username, with a re-scout action to refresh on demand.
- Add a username entry flow on the main menu and a new scouting report screen that presents the dossier with attitude (static roast lines for now; the LLM comes in a later change).
- No changes to the existing local pass-and-play game.

## Capabilities

### New Capabilities
- `chesscom-data-intake`: Fetching a player's profile, stats, and game archives from the chess.com published-data API, including error handling (unknown user, network failure) and polite request pacing.
- `player-dossier`: Deriving the two-depth dossier (100-game deep analysis + career-wide light memory) from the fetched data, and caching/refreshing it in localStorage.
- `scouting-report-ui`: Main-menu username entry, loading/progress states while archives download, and the scouting report screen that displays the dossier.

### Modified Capabilities

<!-- none — no existing specs; the local game's behavior is unchanged -->

## Impact

- **New code**: chess.com API client + dossier derivation logic (likely `src/services/` or `src/api/` — new directory), dossier types in `src/types/`, new `ScoutingReport` screen component, username entry added to `MainMenu`, a new `ScreenName` in `App.tsx`.
- **Dependencies**: possibly a lightweight PGN header parser, though `chess.js` can load PGNs already — prefer no new dependency.
- **Storage**: first use of `localStorage` in the project.
- **Future-proofing**: the dossier type is the contract the future trash-talk engine (LLM via serverless function, later change) will consume; its shape should be designed with that consumer in mind. No serverless/backend work in this change.
