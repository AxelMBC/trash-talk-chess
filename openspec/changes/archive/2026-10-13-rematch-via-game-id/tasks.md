# Reset per-game hooks from a gameId counter instead of an imperative rematch handler

## 1. Game id

- [x] 1.1 Add `gameId: number` to `ChessGameState` in `src/hooks/useChessGame.ts`: 0 initially, set to `prev + 1` by `reset()` in the same state update as the new position

## 2. Hooks reset on gameId

- [x] 2.1 `useEngineOpponent`: replace `startNewGame` with an effect on `game.gameId` that skips the first run and is declared before the turn loop; remove `startNewGame` from `EngineOpponent`
- [x] 2.2 `useTrashTalk`: key the reset effect on `game.gameId` and `enabled` instead of `game.lastMove`; add `game.gameId` to the stopwatch and slow-play effect deps
- [x] 2.3 `useTableTurn`: take `game: ChessGame`; replace `reset` with a `useLayoutEffect` on `game.gameId` that skips the first run, is declared before the turn effect, cancels the turn in flight, sets `prevTurnRef` to `game.turn` and puts orientation, `isTurning` and the motion values back at rest; remove `reset` from `TableTurn`

## 3. Game screen

- [x] 3.1 `GameScreen`: pass `game` to `useTableTurn`; `handleRematch` becomes `game.reset()`

## 4. Verification

- [x] 4.1 Run `/axl:verify`
- [x] 4.2 Vs computer, wait 30 s on move 1 until the slow-play line shows, then press New game: the line clears at once, and no slow-play line appears again until 30 s into the new game
- [x] 4.3 Pass-and-play, play 1. e4 and press New game while the board is turning: the board stops at rest facing White and no lift or rotation plays afterwards
- [x] 4.4 Pass-and-play, play 1. e4 e5 and press New game during the turn back to White: the board settles facing White with no extra rotation
- [x] 4.5 Vs computer, press New game while the engine is thinking: the new game starts with White to move and the old engine move never appears on the board
