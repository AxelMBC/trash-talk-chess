# Proposal: add-ai-opponent

## Why

The app has two polished halves that never meet: a local pass-and-play game with no computer to play against, and a chess.com scouting pipeline that dead-ends at a report. The product vision — playing against an AI that trash-talks you — needs an actual AI opponent as its foundation. This change adds that missing chess brain, playable directly from the main menu.

## What Changes

- Add a **"vs Computer"** game mode launchable from the main menu, alongside the existing Local (pass-and-play) button.
- Integrate **Stockfish (WASM)** running in a Web Worker as the move engine — no backend, stays fully client-side.
- Add a **difficulty picker** in the main menu with a few named levels (Easy / Medium / Hard) mapped to engine presets (skill level / depth / move time).
- The player chooses (or is assigned) a color; the engine plays the other side. Engine moves reuse the existing animated move pipeline (`makeMove`), so piece glide, capture shrink, promotion, check highlight, and game-over flow all work unchanged.
- In vs-computer games the board **does not rotate** between turns — it stays oriented toward the human player. The table-turn rotation remains exclusive to pass-and-play.
- Input is locked while the engine is thinking; a subtle "thinking" indicator shows whose turn it is.
- Engine failures (worker crash, WASM load failure) degrade gracefully with a user-visible error rather than a frozen game.

Out of scope (deliberately deferred): trash talk during vs-computer games, wiring the scouting dossier into difficulty/persona, LLM integration. This change is only the chess brain (Fork A).

## Capabilities

### New Capabilities

- `ai-opponent`: Engine-powered opponent play — main-menu entry with difficulty selection, Stockfish worker lifecycle, engine move loop integrated with the existing game state, thinking indicator, input lockout during engine turns, and failure handling.

### Modified Capabilities

- `turn-transition`: The 180° table-turn rotation SHALL apply only to pass-and-play games. In vs-computer games the board keeps a fixed orientation facing the human player for the entire game.

## Impact

- **New dependency**: a Stockfish WASM package (e.g. `stockfish` npm package or vendored `stockfish.js`/`.wasm` assets served from `public/`), loaded in a Web Worker.
- **`src/App.tsx`**: game screen now receives a game config (mode, difficulty, player color) instead of being parameterless.
- **`src/components/MainMenu/`**: new "vs Computer" button + difficulty picker.
- **`src/components/GameScreen/`**: mode-aware — skips flip choreography in vs-computer mode, drives the engine turn loop, shows thinking state.
- **`src/hooks/useChessGame.ts`**: unchanged or minimally extended (it already exposes `makeMove`/FEN via chess.js); a new hook (e.g. `useEngineOpponent`) owns the worker.
- **New**: `src/services/engine.ts` (UCI worker wrapper) or similar, plus difficulty preset constants.
- **Vite config**: may need worker/asset handling for the WASM binary (COOP/COEP headers only if the threaded build is used; the single-threaded build avoids this).
