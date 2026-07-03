# Tasks: add-ai-opponent

## 1. Engine assets & service

- [x] 1.1 Pick and install the Stockfish WASM package (single-threaded lite variant per design D1/open question); vendor worker + WASM files into `public/engine/`
- [x] 1.2 Create `src/services/engine.ts`: `createEngine()` with `uci`→`uciok` handshake + timeout, `newGame(preset)`, `bestMove(fen, preset)` resolving parsed `{ from, to, promotion? }`, `dispose()`, generation-token staleness guard; errors returned, never thrown (mirror `chesscom.ts` result style)
- [x] 1.3 Define `Difficulty` type and the Easy/Medium/Hard presets (skill level, depth cap, movetime cap) alongside the engine service
- [x] 1.4 Smoke-test the engine in the browser (dev + `npm run preview` production build): handshake completes, `bestMove` returns a legal move from the start position

## 2. Game config plumbing

- [x] 2.1 Add `GameConfig` union (`local` | `computer` with difficulty + playerColor) to `src/types/chess.types.ts`
- [x] 2.2 `App.tsx`: hold the active `GameConfig` in state; pass it to `GameScreen`; wire `onPlayComputer(difficulty)` from `MainMenu`
- [x] 2.3 Verify `useChessGame` exposes what the opponent hook needs (current FEN + from/to `makeMove` with promotion piece); extend its return value minimally if not

## 3. Engine opponent hook

- [x] 3.1 Create `useEngineOpponent(game, config)`: engine lifecycle (create on mount of a computer game, dispose on unmount), turn-loop effect guarded on game status / pending promotion, minimum ~400 ms think delay, exposes `engineStatus`
- [x] 3.2 Engine promotions applied directly with the engine's piece (promotion dialog never opens for engine moves)
- [x] 3.3 Rematch resets the engine (`ucinewgame` + new generation token); stale bestmove responses are discarded

## 4. UI

- [x] 4.1 `MainMenu`: add "vs Computer" button + Easy/Medium/Hard `ToggleButtonGroup` (default Medium), following existing menu motion/styling conventions
- [x] 4.2 `GameScreen`: mode-aware — in computer mode fix orientation to `playerColor`, skip all flip choreography, disable board input while `turn !== playerColor` or engine is loading/thinking
- [x] 4.3 Thinking indicator for the engine's side (via `GameStatusBar`), cleared when the engine's move plays
- [x] 4.4 Engine error state: user-visible message + "Back to menu" (mirroring the ScoutingReport error pattern) for load failure, handshake timeout, and mid-game move failure

## 5. Verification

- [x] 5.1 `npm run lint` and `npm run build` pass
- [x] 5.2 Manual/Playwright pass: full game vs Easy (win or lose) — engine replies animate, promotion by both sides, check highlight, game-over overlay, rematch, exit to menu terminates worker
- [x] 5.3 Confirm pass-and-play is unchanged: table-turn rotation, input lockout, reduced-motion fallback all behave exactly as before
- [ ] 5.4 Confirm difficulty presets feel distinct (Easy blunders; Hard punishes) and engine replies never feel instantaneous
