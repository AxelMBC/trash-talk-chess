## Why

Rematch reset is spread across three owners that each detect it differently: `GameScreen.handleRematch` calls `game.reset()`, `engine.startNewGame()` and `tableTurn.reset()` by hand, while `useTrashTalk` guesses a rematch from `game.lastMove === null`. That guess misses a rematch before the first move and leaves the think-time stopwatch and slow-play timer running from the old game, and every new per-game hook has to be remembered in `handleRematch` or invent its own heuristic.

## What Changes

- `useChessGame` exposes `gameId`, a counter bumped by `reset()`.
- `useEngineOpponent`, `useTrashTalk` and `useTableTurn` reset their per-game state when `gameId` changes.
- `handleRematch` in `GameScreen` reduces to `game.reset()`.
- `EngineOpponent.startNewGame` and `TableTurn.reset` are removed.
- Trash talk resets on every rematch, including one started before any move, and restarts the player's think-time stopwatch and slow-play timer.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `live-trash-talk`: "Session memory enables escalation" — a rematch wipes the session, the line on screen and the turn timers in every case, including before the first move.

## Out of Scope

- Changing how the engine worker is created or terminated; rematch still reuses the live worker.
- Any change to `ai-opponent` or `turn-transition` behaviour: their rematch requirements stay true and are only re-plumbed.
- Remounting `GameScreen` per game (see design, decision 1).

## Impact

- `src/hooks/useChessGame.ts`: new `gameId` field on `ChessGame`.
- `src/hooks/useEngineOpponent.ts`: `startNewGame` removed from `EngineOpponent`; reset driven by `game.gameId`.
- `src/services/engine.ts`: `bestMove` runs searches one after another, so a new search never reads a stopped search's `bestmove`.
- `src/hooks/useTrashTalk.ts`: reset keyed on `game.gameId`; stopwatch and slow-play effects also key on it.
- `src/hooks/useTableTurn.ts`: `reset` removed from `TableTurn`; takes `game` and resets on `game.gameId`.
- `src/components/GameScreen/GameScreen.tsx`: `handleRematch` is `game.reset()`.
