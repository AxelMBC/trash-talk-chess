# Design: add-ai-opponent

## Context

The app is a fully client-side Vite + React SPA. Game logic lives in `src/hooks/useChessGame.ts`, which wraps a chess.js instance in a ref and exposes `ChessGameState` plus imperative actions (`selectSquare`, `makeMove`, `resetGame`). Piece identity is tracked (`TrackedPiece[]` with stable `id`s) so `motion` can animate moves; any opponent must feed moves through the same `makeMove` path to keep animations working. `GameScreen` owns the pass-and-play table-turn rotation; `App.tsx` switches screens with a `ScreenName` union. There is no backend and no routing, and the chess.com scouting feature (already shipped) is read-only.

This change adds a computer opponent (Fork A of the roadmap): engine plays one side, human plays the other, launched from the main menu. Trash talk and dossier integration are explicitly later steps.

## Goals / Non-Goals

**Goals:**
- Playable vs-computer mode with selectable difficulty, entirely client-side.
- Engine moves flow through the existing animated move pipeline unchanged.
- Fixed board orientation (no table-turn) in vs-computer games.
- Graceful handling of engine load/runtime failures.
- Leave clean seams for later steps: dossier-derived difficulty, trash-talk events.

**Non-Goals:**
- Trash talk during play (Fork B).
- Wiring the scouting dossier into the game.
- Backend, accounts, or online play.
- Fine-grained Elo slider or adaptive difficulty.

## Decisions

### D1: Stockfish WASM (single-threaded build) as the engine

Real engine strength with zero backend. The **single-threaded** build is deliberate: the multi-threaded build requires `SharedArrayBuffer`, which demands COOP/COEP headers — impossible on many static hosts and irrelevant at the depths we need. Single-threaded lite (~couple MB WASM) is far stronger than any difficulty preset we'll expose.

*Alternatives considered:* homegrown minimax (weeks of work for weak play), greedy/random (not satisfying, would be thrown away). Rejected.

### D2: Vendor engine assets in `public/engine/`, load via classic `new Worker(url)`

The npm `stockfish` package's worker + WASM files are copied into `public/engine/` (checked in, or copied by a postinstall script — prefer checked in for simplicity and reproducible builds). The app instantiates `new Worker('/engine/stockfish.js')` directly.

*Why not import through Vite's worker bundling:* Emscripten workers that locate their own `.wasm` by relative URL break under bundler renaming/hashing. Serving verbatim from `public/` sidesteps the entire class of problems and keeps the engine out of the JS bundle (loaded only when a vs-computer game starts).

### D3: `src/services/engine.ts` — a small promise-based UCI wrapper

Mirrors the style of `chesscom.ts` (typed results, errors returned not thrown):

- `createEngine(): Promise<EngineHandle>` — spawns worker, performs `uci` → `uciok` handshake with a timeout.
- `EngineHandle.newGame(preset)` — `ucinewgame` + `setoption Skill Level`.
- `EngineHandle.bestMove(fen, preset): Promise<EngineResult<UciMove>>` — `position fen ... ` + `go depth D movetime M`, resolves on `bestmove`. UCI move parsed to `{ from, to, promotion? }` (chess.js `Square`/`PieceSymbol` types).
- `EngineHandle.dispose()` — terminates the worker.
- Every request carries a generation token; responses from a stale generation (after rematch/exit) are dropped.

### D4: Difficulty = three named presets combining Skill Level + depth + movetime

| Preset | Skill Level | Depth cap | Movetime cap |
|---|---|---|---|
| Easy | 2 | 4 | 300 ms |
| Medium | 8 | 8 | 600 ms |
| Hard | 18 | 14 | 1200 ms |

Skill Level alone still plays scary-well at high depth, so depth/movetime caps do the real softening on Easy. Constants live beside the engine service so later dossier-derived difficulty is a matter of computing a preset. A minimum ~400 ms artificial think delay is applied before playing the engine's move so replies never feel teleported.

*Alternative considered:* `UCI_LimitStrength`/`UCI_Elo` — not reliably supported across lite builds; skill+depth is portable.

### D5: New hook `useEngineOpponent`; `useChessGame` stays untouched

`useEngineOpponent(game, config)` owns the engine lifecycle and the turn loop: an effect watches `game.state.turn`; when it's the engine's color, the game is active, and no promotion is pending, it requests `bestMove(currentFen)` and plays the result via `game.makeMove(...)` (engine promotions pass the promotion piece directly — the `PromotionDialog` never opens for engine moves). Exposes `{ engineStatus: 'loading' | 'idle' | 'thinking' | 'error' }`.

*Why a separate hook:* `useChessGame` is the single source of truth for rules/animation identity and is shared by pass-and-play; the opponent is an orthogonal concern layered on top of its public API. If `useChessGame` doesn't currently expose the FEN or a direct from/to `makeMove`, extend its return value minimally rather than restructuring it.

### D6: Game config flows from menu through `App` to `GameScreen`

```
MainMenu ──onPlayLocal──────────────▶ App ── GameConfig ──▶ GameScreen
        ──onPlayComputer(difficulty)▶
```

`GameConfig = { mode: 'local' } | { mode: 'computer'; difficulty: Difficulty; playerColor: Color }` (in `chess.types.ts`). `App` stores the config in state when a game starts; `screen: 'game'` renders `GameScreen config={...}`. **v1: the human always plays White** — the config carries `playerColor` so a color picker later is a menu-only change.

Menu UI: a "vs Computer" button next to "Local", with a compact Easy/Medium/Hard selector (MUI `ToggleButtonGroup`), defaulting to Medium.

### D7: vs-computer games never rotate; orientation = player color

`GameScreen` skips the entire flip choreography when `config.mode === 'computer'` (`orientation` fixed to `playerColor`, flip effect not scheduled, `isFlipping` never set). Board input is additionally disabled whenever `turn !== playerColor` or `engineStatus === 'thinking' | 'loading'`. A small status line ("thinking…") reuses `GameStatusBar`.

### D8: Failure handling — error state, never a frozen board

Engine load failure or handshake timeout → `engineStatus: 'error'` with a visible message and "Back to menu" (mirrors the ScoutingReport error pattern). A `bestMove` failure mid-game shows the same terminal error state. No silent retry loops.

## Risks / Trade-offs

- [WASM asset size (~1.5–2.5 MB) inflates repo/first-load] → served from `public/`, fetched lazily only when a vs-computer game starts; not in the JS bundle.
- [Easy preset still too strong for true beginners] → depth 4 + 300 ms is quite blunder-prone, but if not, add a random-blunder filter to the preset later — the preset abstraction contains it.
- [Stale `bestmove` after rematch/exit corrupts a new game] → generation token per game (D3); `dispose()` on unmount.
- [Emscripten worker pathing breaks under some hosting setups] → assets are verbatim in `public/engine/`, path is absolute; verified in `npm run preview` (production build) as part of the tasks.
- [Engine move during `pendingPromotion` or game-over race] → the turn-loop effect guards on game status and pending promotion before requesting a move.

## Open Questions

- Exact npm package/variant to vendor (`stockfish` package's `stockfish-nnue-16-single.js` lite variant vs `stockfish.js` package) — resolve at implementation time by checking bundle size and single-thread support; the wrapper API (D3) is unaffected.
- Whether `useChessGame` needs a `fen` accessor added or already exposes one — check during implementation (trivial either way).
