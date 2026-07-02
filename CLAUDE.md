# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then bundle with Vite
- `npm run lint` — run oxlint (config in `.oxlintrc.json`)
- `npm run preview` — serve the production build locally

There is no test suite. Playwright is installed as a devDependency but has no config or tests yet.

## Stack

React 19 + TypeScript (strict) + Vite, MUI v9 (dark theme), `motion` (Framer Motion successor) for animation, `chess.js` for all rules/legality. Path alias `@/` → `src/` (defined in both `vite.config.ts` and `tsconfig.app.json`).

## Architecture

Two-screen SPA with no routing: `App.tsx` toggles between `MainMenu` and `GameScreen` via a `ScreenName` state, wrapped in `AnimatePresence` for transitions. Currently local two-player only; the roadmap adds chess.com integration and AI trash talk later.

### Game state: `src/hooks/useChessGame.ts`

The single source of truth for game logic. It wraps a `chess.js` instance in a ref (mutable engine) and mirrors derived UI state into one `ChessGameState` object (pieces, turn, status, legal moves, captures, pending promotion, check square). All components consume this hook's return value via props — there is no context or external store.

The key design constraint is **stable piece identity for animation**: instead of re-deriving the board each move, `TrackedPiece[]` carries an `id` per piece and `updatePieces()` moves/removes pieces incrementally (handling en passant's offset capture square and castling's rook hop). `ChessPiece` components are keyed by that `id`, so `motion` springs glide pieces between squares and `AnimatePresence` shrinks captured pieces out. Breaking id stability breaks the animations.

Promotion is a two-phase flow: `selectSquare` detects a promotion move and sets `pendingPromotion` instead of moving; `PromotionDialog` then calls `makeMove` with the chosen piece.

### Board rendering: `src/components/ChessBoard/`

The board is two layers: an 8×8 CSS grid of `BoardSquare`s (highlights, labels, click targets) with an absolutely-positioned piece layer on top. Pieces position themselves by `x/y` percentage transforms from `squareToCol/squareToRow` in `src/utils/board.ts`, which handle orientation. The piece layer is keyed by `orientation` so pieces snap (not glide) when the board flips.

`GameScreen` owns the board-flip choreography: after each move it waits `FLIP_DELAY_MS` for the piece glide, then plays a two-stage `rotateY` animation and swaps orientation at the 90° midpoint. Input is disabled while flipping (`isFlipping`), and `useReducedMotion` skips the animation.

### Theme

`src/theme/theme.ts` exports the MUI theme (default export) plus `BOARD_COLORS`, a separate constant for square/highlight colors that intentionally live outside the MUI palette.

## Conventions

- Components are `const` arrow functions with `export default` at the bottom of the file.
- Each component lives in `src/components/ComponentName/` with `ComponentName.tsx`, `ComponentName.types.ts` (props interfaces), and an `index.ts` re-export.
- Shared domain types go in `src/types/chess.types.ts`; reuse `chess.js` types (`Color`, `Square`, `PieceSymbol`, `Move`) rather than redefining them.
- Always import via the `@/` alias, not relative paths across directories.
