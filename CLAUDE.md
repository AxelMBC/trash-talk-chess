# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then bundle with Vite
- `npm run lint` — run oxlint (config in `.oxlintrc.json`)
- `npm run preview` — serve the production build locally

There is no test suite. Playwright is installed as a devDependency but has no config or tests yet.

## Stack

React 19 + TypeScript (strict) + Vite, MUI v9 (dark theme), `motion` (Framer Motion successor) for animation, `chess.js` for all rules/legality, Stockfish 18 (lite, single-threaded WASM, served from `public/engine/`) as the computer opponent. Path alias `@/` → `src/` (defined in both `vite.config.ts` and `tsconfig.app.json`).

## Architecture

Three-screen SPA with no routing: `App.tsx` switches between `MainMenu`, `GameScreen` and `ScoutingReport` via a `ScreenName` state, wrapped in `AnimatePresence` for transitions. `GameScreen` takes a `GameConfig`: local pass-and-play, or vs the computer at a `Difficulty` (the human always plays White for now).

### Game state: `src/hooks/useChessGame.ts`

The single source of truth for game logic. It wraps a `chess.js` instance in a ref (mutable engine) and mirrors derived UI state into one `ChessGameState` object (pieces, turn, status, legal moves, captures, pending promotion, check square). All components consume this hook's return value via props — there is no context or external store.

The key design constraint is **stable piece identity for animation**: instead of re-deriving the board each move, `TrackedPiece[]` carries an `id` per piece and `updatePieces()` moves/removes pieces incrementally (handling en passant's offset capture square and castling's rook hop). `ChessPiece` components are keyed by that `id`, so `motion` springs glide pieces between squares and `AnimatePresence` shrinks captured pieces out. Breaking id stability breaks the animations.

Promotion is a two-phase flow: `selectSquare` detects a promotion move and sets `pendingPromotion` instead of moving; `PromotionDialog` then calls `makeMove` with the chosen piece.

### Board rendering: `src/components/ChessBoard/`

The board is two layers: an 8×8 CSS grid of `BoardSquare`s (highlights, labels, click targets) with an absolutely-positioned piece layer on top. Pieces position themselves by `x/y` percentage transforms from `squareToCol/squareToRow` in `src/utils/board.ts`, which handle orientation. The piece layer is keyed by `orientation` so pieces snap (not glide) when the orientation changes.

`GameScreen` owns the table-turn choreography in local mode: after each move it waits `TURN_DELAY_MS` for the piece glide, then lifts the board, orbits it 180° in-plane and settles it back. At 180° it resets the rotation and swaps `orientation` in the same paint (`flushSync`), which is visually identical. Input is disabled while turning (`isTurning`), and `useReducedMotion` swaps orientation without the animation. Vs the computer the board stays fixed toward the human.

### Computer opponent: `src/hooks/useEngineOpponent.ts`

`src/services/engine.ts` runs Stockfish in a Web Worker over UCI and returns `EngineResult` values instead of throwing. `ENGINE_PRESETS` maps each `Difficulty` to the engine's search settings. The hook plays the engine's moves through `useChessGame` and exposes `engineStatus` and the last `SearchReport` (score), which `GameScreen` uses to block input outside the human's turn.

### Trash talk: `src/hooks/useTrashTalk.ts`

Vs the computer only. Each move is classified (`src/utils/moveQuality.ts` from the engine score, `src/utils/tactics.ts` for events) into a `TrashTalkMoment`, which a `LineSource` turns into a line shown in `TrashTalkBubble`. `src/services/lineSource.ts` is the swap seam: today `activeLineSource` picks from the static bank in `src/data/trashTalk.ts`; the planned LLM source (`docs/llm-trash-talk-plan.md`) plugs in there with `src/data/persona.md` as its system prompt, and `resolveLine` falls back to the static bank on timeout or failure.

### Scouting: `src/hooks/useScoutingReport.ts`

`src/services/chesscom.ts` reads the public chess.com API (profile, stats, recent games). `src/services/dossier.ts` reduces them to a `PlayerDossier`, cached in `localStorage`. `src/services/playerBrief.ts` remembers the last scouted player, so trash talk can use their dossier in the next game.

### Theme

`src/theme/theme.ts` exports the MUI theme (default export) plus `BOARD_COLORS`, a separate constant for square/highlight colors that intentionally live outside the MUI palette.

## Commit format

`type: :gitmoji: imperative summary in lowercase`, e.g. `feat: :sparkles: add vs-computer mode with Stockfish and difficulty levels`.

## Spec workflow

Live specs in `openspec/specs/` are the authoritative record of behaviour. Changes are proposed in `openspec/changes/` and moved to `openspec/changes/archive/` when done.

The flow is `/axl:explore` → `/axl:propose` (or `/axl:tweak` for small changes) → `/axl:apply` → `/axl:verify` → `/axl:archive`. Use `/axl:audit <path|feature>` to review existing code.

## Where the rest of the guidance lives

- The axl plugin: base rules, the spec workflow and its hooks.
- `.claude/rules/code-style.md`: code conventions for `src/`.
- `.claude/axl.json`: base branch, protected branches and the checks (typecheck, lint).
