# Proposal: add-live-trash-talk

## Why

The app is called Trash Talk Chess, yet no trash talk happens during a game — the roast copy only exists on the scouting report screen. The vs-computer mode shipped in `add-ai-opponent` gives the engine a brain but no mouth. This change gives it one: a running stream of one-liner taunts reacting to every move, which is the app's identity feature and the seam a future LLM voice will plug into.

## What Changes

- After **every player move** in a vs-computer game, the engine drops a one-liner reacting to the move's quality: brutal roasts for bad moves ("My god you are bad at chess"), grudging respect for good ones ("That was a good move, I did not know an 800 knew how to fork"), and boredom for neutral ones ("You are one hell of a boring player").
- After **every engine move**, the engine taunts/rage-baits the player, including hints at where the game is heading (e.g., "3 moves away and you will finally stop wasting my time" when mate is near, "You are fucked" when the position collapses).
- Move quality is judged **objectively** by reusing the already-vendored Stockfish: the engine service is extended to report position evaluations (UCI `info score cp/mate` lines it currently ignores), so "bad move" means the eval actually dropped, not a random insult.
- Difficulty-aware jabs: lines can reference the chosen difficulty ("I do not know why you chose medium difficulty when you make moves like that") on Medium/Hard.
- Pattern-aware lines: detectable tactics/events (fork, capture, check, promotion, long think time before moving) unlock specialized lines ("Hey buddy, can you make your moves faster?").
- A new **speech-bubble style UI** shows each line near the board, appearing cleanly and auto-dismissing after ~10 seconds (or when replaced by the next line).
- The line source is a curated static phrase bank (user-provided phrases, improved and extended), organized by trigger category — deliberately the same swap-seam pattern as `data/roasts.ts` so an LLM can replace the picker later without touching the UI or event detection.
- Pass-and-play games are unaffected: no trash talk outside vs-computer mode.

### LLM-readiness refinement (added before archive)

- **Persona document**: the AI's voice (identity, tone rules, do/don'ts, canonical examples) lives in an authored markdown file (`src/data/persona.md`) that becomes the LLM system prompt in the next step — editable without touching code.
- **Player profile brief**: when a chess.com scouting dossier exists (localStorage cache), a compact markdown brief plus structured facts are generated and fed into line selection; a few profile-aware static lines prove the pipe end to end.
- **Structured moment payload**: every trigger builds a `TrashTalkMoment` (FEN, PGN so far, last move SAN, quality verdict, event, position advantage as number + word, mate distance, session stats, difficulty, profile) — the single input contract for any line source.
- **Async line source seam**: line production becomes `(moment) => Promise<line>` with a timeout-falls-back-to-static policy, so an LLM source plugs in later without touching the hook, event detection, or the bubble.
- **Session memory**: per-game tracking of blunder count, think time, and lines already said — no line repeats within a game, and escalation lines ("blunder number 3…") become possible.

## Capabilities

### New Capabilities

- `live-trash-talk`: in-game one-liner taunts in vs-computer mode — trigger events (player move quality, engine move, tactics, slow play), line selection rules (category, difficulty-awareness, no immediate repeats), and the timed speech-bubble presentation.

### Modified Capabilities

<!-- none — ai-opponent requirements are unchanged; eval reporting is an internal extension of the engine service, and turn-transition is untouched -->

## Impact

- **`src/services/engine.ts`**: extended to parse `info score cp/mate` lines during search and expose a position-evaluation API alongside `bestMove` (implementation detail; no ai-opponent requirement changes).
- **New**: trash-talk phrase bank data module, a move-classification utility (eval delta → bad/neutral/good, plus tactic detection via chess.js), a hook or module wiring game events to line selection, and a speech-bubble component on the game screen.
- **`src/components/GameScreen/`**: hosts the speech bubble and passes game/engine context to the trash-talk system; vs-computer only.
- **No new dependencies, no network, no API keys** — everything runs on the already-vendored Stockfish WASM and chess.js.
- Existing `data/roasts.ts` (scouting report) is untouched but its dossier data MAY be read later for personalized lines (out of scope here).
