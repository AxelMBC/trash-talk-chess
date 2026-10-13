## Context

Four hooks hold per-game state: `useChessGame` (the position), `useEngineOpponent` (search generation, last report), `useTrashTalk` (session memory, line, timers) and `useTableTurn` (orientation, in-flight turn, motion values). Today `GameScreen.handleRematch` resets three of them imperatively and `useTrashTalk` infers a rematch from `game.lastMove === null`, which misses a rematch before the first move and never re-arms the turn-keyed timers when `turn` and `status` are unchanged across the reset.

## Goals / Non-Goals

**Goals:** one signal for "a new game started" that every per-game hook reads; a `handleRematch` that cannot forget a hook; trash talk reset in every rematch case.

**Non-Goals:** changing the engine worker lifecycle; changing any visible turn-transition or engine behaviour.

## Decisions

### 1. A `gameId` counter on `useChessGame`, not a remount

`useChessGame` holds `gameId` in its state, starting at 0, and `reset()` sets it to `prev + 1` in the same state update that resets the position, so the new id and the new position arrive in one render. Hooks key their reset on `game.gameId`.

Rejected: keying `GameScreen` (or an inner per-game subtree) so React remounts everything per game. It resets all state for free, but it tears down and reloads the Stockfish WASM worker on every rematch, flashing the engine's loading state; and because the hooks live in `GameScreen` itself, an inner keyed subtree would mean hoisting the engine above it — a bigger restructure than this change.

### 2. Hooks react to a change of `gameId`, not to its value

Each hook resets when `game.gameId` differs from the id it last saw, so mount does not trigger a reset (the engine handle may not exist yet, and `useTableTurn` must not jump motion values on mount). `useTrashTalk` keeps running its reset body on mount as well, because loading the player profile there is part of its initialisation today.

### 3. Effect order and timing per hook

- `useEngineOpponent`: the `gameId` effect is declared **before** the turn loop. Effects run in declaration order within a commit, so the generation is bumped and `handle.newGame(preset)` sent before any search for the new game captures the generation. It keeps today's `startNewGame` body minus the report: bump generation, `newGame`, status `idle` when a handle exists. The turn loop also depends on `gameId`, so a rematch that leaves the engine to move (engine as White) starts a fresh search. `lastReport` is not cleared by the effect, which would land a commit after the rematch render; each report is tagged with the `gameId` its search started in and exposed only while that id is current, so consumers never judge the old game's score in the new one. Because that search can start in the same commit that `newGame` sends `stop`, `engine.ts` runs searches one after another: a search starts listening only once the previous one has read its own `bestmove`, and one superseded while waiting resolves `stale` without running.
- `useTableTurn`: the reset runs in a `useLayoutEffect` declared before the turn effect. It must set `prevTurnRef` to the new game's turn before the turn effect compares it (otherwise a rematch from Black's turn reads as a turn change and plays a turn), and orientation, `isTurning` and the motion values must reset before paint, as the event handler does today, or one frame shows the new position in the old orientation. State updates in a layout effect re-render synchronously before paint.
- `useTrashTalk`: the reset stays a `useEffect` (a one-frame stale line is hidden by the bubble's exit animation). The stopwatch and slow-play effects add `game.gameId` to their deps so they re-arm when `turn` and `status` look unchanged across a rematch.

### 4. `useTableTurn(game, config)`

`useTableTurn` takes `game: ChessGame` like the other per-game hooks instead of growing a third positional argument next to `turn` and `status`.

## Risks / Trade-offs

- An effect-driven reset runs in the commit after the handler, not inside it → decision 3: a layout effect where a stale frame would show, declaration order where a race would matter.
- A future per-game hook can still forget to read `gameId` → it no longer needs anything from `handleRematch`, and four hooks show the pattern to copy.

## Open Questions

- none
