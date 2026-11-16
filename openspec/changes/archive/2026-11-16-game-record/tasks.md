# Add a move record with position viewing, takeback vs the computer and discard confirmation

## 1. Move record in `useChessGame`

- [x] 1.1 Add `moves: Move[]` to `ChessGameState`; append in `makeMove`, empty in `createInitialState`; make `getLastMove` read `moves.at(-1)`
- [x] 1.2 Extract `piecesAt(moves, ply)` (replay `updatePieces` from the starting pieces) and `capturedFrom(moves)` as pure helpers next to `updatePieces`

## 2. Viewing earlier positions

- [x] 2.1 Add `viewPly: number | null` to state and the view types to `src/types/chess.types.ts`
- [x] 2.2 Derive `view` (`ply`, `isLive`, `pieces`, `lastMove`, `checkSquare`), replaying only when `viewPly !== null`
- [x] 2.3 Add `viewMove(ply)`, `stepView(delta)` (clamped to `0..moves.length`, landing on the last ply sets live) and `viewLive()`
- [x] 2.4 `makeMove` resets `viewPly` to `null`; `selectSquare` returns early when the view is not live
- [x] 2.5 `GameScreen`: feed `ChessBoard` from `game.view`, add `!view.isLive` to `disabled`

## 3. Takeback

- [x] 3.1 Add `takeback(restoreTurnTo: Color)` to `useChessGame`: `chess.undo()` until that color is to move with one fewer of its moves, then re-derive `moves`, `pieces`, `captured`, `turn`, `status`, `winner`, `lastMove`, `moveNumber`, `checkSquare`; clear selection; keep `gameId`
- [x] 3.2 `GameScreen`: compute `canTakeback` (vs computer, human's turn, engine idle, not over, view live, human has a recorded move) and wire the handler
- [x] 3.3 `useTrashTalk`: baseline stack pushed per engine report; on `moves.length` dropping within a game, pop to the restored baseline, clear the line and TTL timer, reset `awaitingQualityRef`, restart the stopwatch; add `game.moves.length` to the slow-play timer deps; reset the stack on rematch

## 4. Move list UI

- [x] 4.1 Create `src/components/MoveList/` (`MoveList.tsx`, `MoveList.types.ts`, `index.ts`): numbered rows, clickable moves as buttons, current-ply marker, step controls (start, back, forward, live), sticker style, `aria-current` on the marked move
- [x] 4.2 Scroll the marked move into view on change; instant under reduced motion
- [x] 4.3 Place it in `GameScreen`: column beside the board column on wide viewports without shifting the board, fixed-height one-row strip inside the column on narrow ones
- [x] 4.4 Add the "Takeback" sticker button (vs computer only, disabled per `canTakeback`)
- [x] 4.5 Left/right arrow keys step the view at screen level; ignored while a dialog is open, the table is turning, or focus is in a text field

## 5. Discard confirmation

- [x] 5.1 Create a sticker `ConfirmDialog`, sharing `PromotionDialog`'s panel styles if they can be lifted to `src/theme/sticker.ts`
- [x] 5.2 `GameScreen`: `pendingDiscard` state; "New game" and "← Menu" ask when `moves.length > 0 && !gameOver`, otherwise act at once; game-over overlay actions bypass it

## 6. Verification

- [ ] 6.1 Run `/axl:verify`
- [ ] 6.2 vs computer: play 1.e4 and a few more moves including a capture. Expect the list to show numbered SAN pairs with the latest move marked
- [ ] 6.3 Press ← repeatedly to the start, then →. Expect pieces to glide between positions (not pop), the captured piece to reappear when stepping back over the capture, and clicks on the board to do nothing until back on live
- [ ] 6.4 Step back, then wait in a position where the engine is thinking (step back right after moving). Expect the board to jump to live and show the engine's reply when it lands
- [ ] 6.5 Castle, then step back and forward over it. Expect king and rook to both glide each way
- [ ] 6.6 Blunder a piece, note the roast, click Takeback. Expect both moves to leave the list, the captured piece to reappear on its square and leave the plate, the bubble to clear, and the engine to stay idle; then play a quiet move and expect no "good move" line for it
- [ ] 6.7 Takeback down to the starting position. Expect the button to disable and the list to be empty
- [ ] 6.8 Mid-game click "New game", then Cancel, then "← Menu" and Escape. Expect the game unchanged each time; confirm once and expect the reset. Before any move, expect "New game" to act with no dialog
- [ ] 6.9 Local game: play a move, and during the table turn press ←. Expect nothing until the turn finishes; then step back and expect the pieces to move without the table turning. Expect no Takeback button
- [ ] 6.10 Resize to about 400px wide and to a wide desktop window. Expect a one-row scrolling strip with no page scroll on the phone width, a side column with the board still centered on desktop, and the board not moving as moves are added
- [ ] 6.11 Finish a game and press ← a few times. Expect the board behind the overlay to step back. Then click Rematch and expect it to act with no confirmation and the new game's list to be empty
