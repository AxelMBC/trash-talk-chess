## Context

`useChessGame` wraps a chess.js instance in a ref and mirrors UI state into one `ChessGameState`. Pieces are `TrackedPiece[]` with an `id` derived from the piece's starting square (`buildPieces`, `useChessGame.ts:48`), moved incrementally by `updatePieces` so `motion` can glide them. Three hooks read the live game: `useEngineOpponent` (turn loop keyed on `turn`/`status`/`gameId`), `useTrashTalk` (keyed on `turn`/`lastMove`/`lastReport`) and `useTableTurn` (keyed on `turn`/`gameId`). The board is fed `pieces`, `lastMove`, `checkSquare` from `GameScreen`.

Constraint: piece `id`s must stay stable through viewing and takeback, or the glide and capture animations break.

## Goals / Non-Goals

**Goals:** a move record in state; viewing any earlier position; takeback vs the computer; no change to how the three live-game hooks trigger.

**Non-Goals:** per-move verdicts in the record, persistence, takeback in local mode.

## Decisions

### 1. The record is `moves: Move[]` in `ChessGameState`

Append the chess.js verbose `Move` returned by `chess.move()` in `makeMove`. It already carries `san`, `from`, `to`, `flags`, `captured`, `promotion`, `color`, which is everything `updatePieces` and the move list need.

Beat: reading `chess.history({ verbose: true })` on demand (as `getLastMove` does today). That recomputes the whole history per call and is not reactive state, so the list would depend on unrelated re-renders.

`getLastMove()` can then return `moves.at(-1)`; keep its signature.

### 2. Viewing is a cursor plus a derived position; the live fields do not change

Add `viewPly: number | null` (`null` = live; `0` = starting position; `n` = after the n-th move). Expose a derived `view: { ply, isLive, pieces, lastMove, checkSquare }` and `viewMove(ply)` / `stepView(delta)` / `viewLive()`. `GameScreen` passes `view.pieces`, `view.lastMove`, `view.checkSquare` to `ChessBoard` and adds `!view.isLive` to the board's `disabled`. `pieces`, `lastMove`, `turn`, `status`, `captured` stay live.

Beat: overwriting `pieces`/`lastMove` in state while browsing. `useTrashTalk` and `useTableTurn` key effects on `lastMove`/`turn`; they would read browsing as moves.

`makeMove` sets `viewPly` back to `null`, and `selectSquare` returns early when not live.

### 3. A viewed position is rebuilt by replaying `updatePieces` from the start

`piecesAt(ply) = moves.slice(0, ply).reduce(updatePieces, buildPieces(new Chess()))`. Ids come from starting squares, so the replay yields the same ids as live play and pieces glide between any two plies; captured pieces re-enter through `AnimatePresence`. `view.lastMove` is `moves[ply - 1]`; `view.checkSquare` is the king of the side to move when that move's SAN ends in `+` or `#`, found in the replayed pieces. No second chess.js instance is needed.

Cost: at most a few hundred `updatePieces` passes over 32 pieces, only when the cursor changes. Compute it only when `viewPly !== null`; live rendering keeps using the incremental `pieces`.

Beat: storing a `TrackedPiece[]` snapshot per ply (memory grows with game length for something recomputable in microseconds), and inverse `updatePieces` (needs captured-piece ids and promotion reversal; a second code path to keep correct).

### 4. Takeback is `chess.undo()` twice plus a full re-derivation

`takeback(restoreTurnTo)` in `useChessGame`: call `chess.undo()` until that color is to move again with one fewer of its own moves (two plies when it is already that color's turn), and do nothing when that color has no recorded move. Then set `moves` to the shortened list, `pieces` to `piecesAt(moves.length)`, `captured` re-derived from `moves`, and `turn`/`status`/`moveNumber`/`checkSquare`/`lastMove` from the chess instance as `makeMove` does. `chess.undo()` keeps chess.js's own repetition and fifty-move bookkeeping correct. `gameId` does not change.

`useChessGame` stays mode-agnostic: it only knows which color gets the move back; `GameScreen` decides availability (`isComputer`, `turn === playerColor`, `engineStatus === 'idle'`, not game over, `view.isLive`, the human has a move in `moves`).

Engine: `turn` is the human's before and after, so the turn loop's deps do not change and no search starts. With `engineStatus === 'idle'` required there is no search in flight to invalidate.

Beat: bumping `gameId` and replaying moves into a fresh game. That would reset trash-talk session stats and the engine, which the spec says to keep.

### 5. Trash talk restores its score baseline from its own history

`useTrashTalk` computes `delta = cp - prevScoreRef.current` on each engine report (`useTrashTalk.ts:160-162`). After a takeback `prevScoreRef` holds the undone reply's score. Keep a stack of baselines (one pushed per engine report) and, when `game.moves.length` drops within the same `gameId`, pop one per undone engine reply and set `prevScoreRef` to the new top (the fresh-game initial value when empty). The same effect clears the line and TTL timer, resets `awaitingQualityRef`, and restarts the stopwatch; add `game.moves.length` to the slow-play timer's deps so it re-arms.

`engine.lastReport` stays the undone report object; the report effect already ignores a report it has seen (`seenReportRef`), so no line fires.

Beat: putting scores in the `Move` record now. That is the post-game-review change's data model; deciding it here would be designing that change by accident.

### 6. Move list layout does not join the board column's flow on wide viewports

The board column is `min(94vw, 66dvh, 620px)` wide and centered (`GameScreen.tsx:93`). On wide viewports position the list beside that column (absolutely, off its right edge) so the board stays centered and never shifts; below the breakpoint render it as a fixed-height one-row strip inside the column. Both have a fixed size from the first render. `MoveList` receives `moves`, `viewPly` and the navigation callbacks; it owns only its scroll-into-view.

### 7. One confirmation dialog for both discard actions

`GameScreen` holds `pendingDiscard: 'reset' | 'exit' | null`. "New game" and "← Menu" set it when `moves.length > 0 && !gameOver`, otherwise act at once. A sticker `ConfirmDialog` (same panel treatment as `PromotionDialog`; check whether its panel styles can be shared before creating new ones) confirms or cancels; MUI `Dialog` gives Escape and focus trapping. The game-over overlay's Rematch and Main Menu bypass it because the game is over.

## Risks / Trade-offs

- Arrow-key navigation could steal keys from focused controls → listen at the screen level, ignore when a dialog is open or the target is an input, and do not `preventDefault` otherwise.
- A long jump (ply 60 → 0) glides many pieces at once → acceptable; it is the same spring as a move. Reduced motion is already handled by `motion`'s per-piece transitions if the app sets it; verify in the manual check.
- Takeback after the nag fired leaves `saidLines` intact, so the nag may repeat with a different line → intended by the spec.
- The engine-color-is-White case (not reachable today, `App.tsx:31`): takeback of the human's only move would leave the engine to move. Guard `takeback` on restoring the turn to the human and leave the engine's opening move in place.

## Open Questions

- none
