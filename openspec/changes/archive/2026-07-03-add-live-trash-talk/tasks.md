# Tasks: add-live-trash-talk

## 1. Engine score reporting

- [x] 1.1 Extend `src/services/engine.ts` to parse `info ... score cp/mate ... depth ...` lines during each `bestMove` search, keep the deepest one, and return it as `SearchReport { score: { type: 'cp' | 'mate'; value: number }; depth: number }` alongside the move (types exported from the service)
- [x] 1.2 Expose `lastReport: SearchReport | null` from `useEngineOpponent` (updated when a `bestMove` resolves, reset on new game, stale generations discarded as today)

## 2. Classification & tactics utilities

- [x] 2.1 Create `src/utils/moveQuality.ts`: consecutive-report delta → `'bad' | 'neutral' | 'good'` with tunable cp thresholds (wide neutral band, mate clamped to large cp), baseline 0 for the first player move
- [x] 2.2 Create `src/utils/tactics.ts`: detect capture/check/promotion from the `Move` object and fork via a scratch `Chess(fen)` instance (moved piece attacks ≥2 enemy pieces that are higher-value or undefended); export the event-priority order (fork > promotion > check > capture)

## 3. Phrase bank

- [x] 3.1 Create `src/data/trashTalk.ts`: categorized bank (`playerBad`, `playerNeutral`, `playerGood`, `fork`, `capture`, `check`, `promotion`, `engineMove`, `engineMateSoon`, `engineCrushing`, `slowPlay`) of context-aware line functions, seeded with the user's phrases (polished) plus new lines in the same voice, with optional per-line `difficulties` filter
- [x] 3.2 Implement `pickLine(category, ctx)` with no-immediate-repeat tracking per category and difficulty filtering

## 4. Orchestration hook

- [x] 4.1 Create `src/hooks/useTrashTalk.ts`: enabled only in vs-computer games; reacts to each completed player move (classify via reports + tactics, pick line) and each engine move (generic taunt, or mate/crushing category when the report says so); returns the current `{ id, text } | null`
- [x] 4.2 Add the slow-play timer to `useTrashTalk`: fires once per player turn at the threshold (~30 s), cleared on move/rematch/unmount via the generation pattern
- [x] 4.3 Enforce the fire-and-forget posture: missing report → generic category, any internal error swallowed, never delays or blocks the move pipeline

## 5. Speech-bubble UI

- [x] 5.1 Create `src/components/TrashTalkBubble/` (component + types + index) — speech-bubble styling attributed to the engine, `pointer-events: none`, max-width, lives in the status-bar row (never over board squares)
- [x] 5.2 Wire enter/exit with `AnimatePresence` keyed by line id, immediate replace on new line, 10 s auto-dismiss, `useReducedMotion` instant fallback
- [x] 5.3 Mount in `GameScreen` for vs-computer games only; hide the bubble whenever the engine error overlay is active

## 6. Verification

- [x] 6.1 `npm run build` and `npm run lint` pass
- [x] 6.2 Playwright smoke: in a vs-computer game, a line appears after a player move and after the engine's reply, and no bubble ever appears in pass-and-play
- [x] 6.3 Playwright smoke: bubble auto-dismisses after ~10 s, is replaced immediately by the next line, and board squares remain clickable while a line is visible
- [x] 6.4 Targeted check: force a blunder and a strong move in scripted positions and confirm the category chosen matches (bad → roast, good → respect), and a mate-in-N reply search yields a mate-flavored taunt
- [ ] 6.5 Playtest for tone/thresholds: lines feel right per difficulty, slow-play nag timing feels natural (user judgment)

## 7. LLM-readiness refinement

- [x] 7.1 Create `src/types/trashTalk.types.ts`: `TrashTalkMoment` (category, difficulty, fen, pgn, lastMoveSan, quality, event, advantage, mateIn, session, profile), `PositionAdvantage`, `SessionStats`, `PlayerProfile` types; add `advantageFromCp` helper to `moveQuality.ts` and `getPgn()` to `useChessGame`
- [x] 7.2 Create `src/data/persona.md` (identity, tone rules, do/don'ts, canonical examples) and expose it as `PERSONA` from the line-source module via `?raw` import
- [x] 7.3 Create `src/services/playerBrief.ts`: `rememberScoutedPlayer` (called from `useScoutingReport` on both ready paths), `dossierToBrief` markdown renderer, `getPlayerProfile()` → brief + structured facts from the cached dossier
- [x] 7.4 Create `src/services/lineSource.ts`: `LineSource` interface, `staticLineSource`, `resolveLine` with ~2.5 s timeout + static fallback, `activeLineSource` swap constant
- [x] 7.5 Rework `src/data/trashTalk.ts`: entries take the full moment with optional `applies(moment)` predicates (replacing `difficulties`), `pickLine(moment)` returns `{ id, text }`, excludes lines said this game, forbids back-to-back repeats when exhausted; add profile-aware and escalation lines
- [x] 7.6 Rework `useTrashTalk`: build moments per trigger, resolve lines through `resolveLine` with stale-guard, track session stats (blunders, said ids, think time) reset on rematch, load profile once per game

## 8. Re-verification

- [x] 8.1 `npm run build` and `npm run lint` pass
- [x] 8.2 Re-run the trash-talk Playwright smoke suite against the production build (all prior checks still green)
- [x] 8.3 Verify the profile pipe: seed a dossier + last-scout pointer into localStorage, confirm a vs-computer game builds moments with the profile (profile-aware line eligible)
