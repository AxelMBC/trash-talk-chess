# Design: add-live-trash-talk

## Context

vs-Computer mode (change `add-ai-opponent`) runs Stockfish 18 lite in a Web Worker behind `src/services/engine.ts` (promise-based UCI wrapper) and `src/hooks/useEngineOpponent.ts` (turn loop). The wrapper currently parses only `bestmove` lines and discards the `info depth ... score cp/mate ... pv ...` stream Stockfish emits while searching. `data/roasts.ts` established the project's pattern for trash-talk content: a static, threshold-driven bank behind a tiny picker function, deliberately shaped as the seam a future LLM replaces. The user has supplied seed phrases and will supply more; profanity is intentional and in-voice for this app.

## Goals / Non-Goals

**Goals:**
- One funny one-liner after every move in vs-computer games, driven by *objective* move quality and detectable events, with zero added move latency and zero new dependencies.
- A clean speech-bubble presentation that auto-dismisses after ~10 s and never interferes with play.
- All new logic behind swappable seams: phrase bank (future LLM), classifier (future tuning), bubble (pure presentational).

**Non-Goals:**
- LLM-generated lines, backend, or API keys (future change).
- Personalization from the chess.com dossier (future change; the bank's category interface should not preclude it).
- Trash talk in pass-and-play, sound effects, chat history/log UI, localization.

## Decisions

### D1 — Move quality from the reply search's own score stream (no extra searches)

The engine already searches after every player move to produce its reply. Stockfish's `info` lines during that search carry `score cp <x>` / `score mate <n>` from the side-to-move's perspective — i.e. the engine's assessment of the position *the player just created*. Comparing consecutive reply-search scores gives the swing caused by the player's move:

```
engine search N   → score Sₙ   (engine's view after player move N)
engine search N+1 → score Sₙ₊₁ (engine's view after player move N+1)
ΔS = Sₙ₊₁ − Sₙ    → ΔS ≫ 0: player blundered; ΔS ≪ 0: player found a good move
```

`engine.ts` keeps the deepest `info` line seen during each `bestMove` call and returns it alongside the move as a `SearchReport { score: { type: 'cp' | 'mate'; value: number }; depth: number }`. The player's first move uses a baseline score of 0 (start position ≈ equal).

*Alternative rejected:* a dedicated eval search after each player move (`go depth N` on the pre-reply position) — doubles engine work per turn and delays the reply for no gain; the reply search's numbers are free.

### D2 — Classification thresholds live in one tunable module

`src/utils/moveQuality.ts` maps ΔS (centipawns, engine perspective) to `'bad' | 'neutral' | 'good'` with a deliberately wide neutral band (initial: bad ≥ +90 cp swing to engine, good ≤ −40 cp, else neutral), clamping mate scores to a large cp equivalent. Thresholds are constants in this module only — tuning comedy accuracy touches nothing else. Shallow searches on Easy (depth 4) produce noisy evals; the wide neutral band plus the roast-tone of the app make occasional misjudgment acceptable.

### D3 — Tactic/event detection via chess.js, in a pure utility

`src/utils/tactics.ts` inspects the `Move` object and post-move board (a throwaway `Chess(fen)` instance — never the live game instance): capture/check/promotion come free from move flags; **fork** = the moved piece now attacks ≥ 2 enemy pieces that are each higher-value than the mover or undefended. Priority when multiple events match: fork > promotion > check > capture > quality category.

### D4 — Phrase bank: categorized template lines, same seam pattern as roasts.ts

`src/data/trashTalk.ts` exports a bank keyed by trigger category (`playerBad`, `playerNeutral`, `playerGood`, `fork`, `capture`, `check`, `promotion`, `engineMove`, `engineMateSoon`, `engineCrushing`, `slowPlay`), each entry a function `(ctx: TrashTalkContext) => string` receiving `{ difficulty, mateIn?, ... }` so lines can interpolate ("3 moves away…", "…chose medium difficulty…"). Entries carry an optional `difficulties` filter so difficulty-referencing lines only surface on matching games. A `pickLine(category, ctx)` selector tracks the last line id per category to forbid immediate repeats. The user's seed phrases go in verbatim-but-polished; the bank is the single future-LLM swap point (Scenario: line source is swappable).

### D5 — Orchestration in a new `useTrashTalk` hook; `useEngineOpponent` exposes its search report

`useEngineOpponent` gains one output: `lastReport: SearchReport | null`, updated whenever a `bestMove` call resolves (stale-generation results still discarded). A new `src/hooks/useTrashTalk.ts` — mounted by `GameScreen`, enabled only when `isComputer` — watches `game.lastMove`/turn changes plus `lastReport`, runs classification + tactics, picks a line, and returns `{ line: { id, text } | null }`. It also owns the slow-play timer: armed when it becomes the player's turn, fires once at ~30 s, cleared on move/rematch/unmount. `useChessGame` itself stays untouched except that `useTrashTalk` reads existing state (`lastMove` is already tracked for highlights; if only from/to squares are stored today, the hook re-derives the full `Move` via a scratch `Chess` instance — decided at implementation, whichever avoids touching `useChessGame`).

*Alternative rejected:* wiring trash talk inside `useEngineOpponent` — mixes concerns and makes pass-and-play exemption and future LLM swap messier.

### D6 — Bubble UI: one `TrashTalkBubble` component, replace-not-queue, 10 s TTL

`src/components/TrashTalkBubble/` renders the current line in a speech-bubble styled surface anchored near the status bar on the engine's side of the board. `pointer-events: none` guarantees it can never block board input. `AnimatePresence` keyed by line id gives clean enter/exit; a new line replaces the current one immediately (no queue — freshest insult wins). A 10 s timeout clears the line; `useReducedMotion` swaps animations for instant show/hide. Long lines wrap; the bubble has a max-width and never overlaps the board's click targets on small screens (it lives in the status-bar row, not floating over squares).

### D7 — Failure posture: trash talk is fire-and-forget

No trash-talk code path may reject, throw into, or delay the move pipeline. Missing report → fall back to generic category. Any classifier/tactics error → swallow (dev-only console warn) and show nothing. The engine error overlay from `add-ai-opponent` supersedes the bubble (bubble hidden in `error` state).

### D8 — `TrashTalkMoment`: one payload type is the whole contract

All context a line source may ever want is assembled into a single `TrashTalkMoment` (types in `src/types/trashTalk.types.ts`): category, difficulty, FEN, PGN so far, last move SAN, quality, event, advantage `{ cp, label, text }` derived from the engine score we already parse, mate distance, session stats, and the optional player profile. `useChessGame` gains a `getPgn()` accessor (same pattern as `getFen`). The static bank uses a fraction of the payload today; the LLM consumes all of it tomorrow — and the hook never changes again.

### D9 — Async `LineSource` with timeout-falls-back-to-static

`src/services/lineSource.ts` defines `LineSource = (moment) => Promise<PickedLine | null>` and `resolveLine(source, moment)`: race the source against a ~2.5 s timeout; on failure or timeout fall back to the static bank source; on double failure show nothing. The hook stamps each request with its line sequence number and discards resolutions that lost the race to a newer trigger. `activeLineSource` is the one-constant swap point for the future LLM source. The static source resolves in a microtask, so today's behavior is unchanged.

### D10 — `persona.md` shipped as source, imported `?raw`

The voice bible lives at `src/data/persona.md` and is imported as a raw string (Vite `?raw`), exported from the line-source module as `PERSONA`. It is the authored contract for tone — identity, rules, do/don'ts, canonical examples (the user's seed phrases) — and will be pasted verbatim into the LLM system prompt next step. Editing it requires zero code knowledge.

*Alternative rejected:* generating persona text from the phrase bank — backwards; the persona is the source of truth the bank should conform to.

### D11 — Player brief derived on demand from the existing dossier cache

`src/services/playerBrief.ts` renders the scouting dossier into a compact markdown brief plus structured facts. The dossier cache is per-username, so `useScoutingReport` records a `ttc:last-scout` pointer whenever a dossier becomes ready (cache hit or fresh build); at game start the trash-talk hook resolves pointer → cached dossier → brief. Deriving on demand (not persisting the brief) means the brief format can evolve freely and never goes stale relative to the dossier.

### D12 — Session memory in the hook; bank entries gain `applies` predicates

The hook tracks per-game refs: player blunder count, said-line ids, and turn think time, all reset on rematch. Bank entries are generalized from a `difficulties` filter to an optional `applies(moment)` predicate (the same shape as `roasts.ts` rules) — difficulty gating, profile-aware lines, and escalation lines ("blunder number N") all become predicates. `pickLine(moment)` filters by predicate, excludes said ids while alternatives exist, and still forbids back-to-back repeats when the pool is exhausted; it returns `{ id, text }` so the hook can record what was said.

## Risks / Trade-offs

- [Noisy evals at shallow depth make "bad move" occasionally wrong] → wide neutral band (D2), thresholds isolated in one module, and the app's tone forgives misfires.
- [Consecutive-search delta misses the *reason* for a swing (engine's own previous move contributes)] → acceptable: the engine plays near its preset strength consistently, so big deltas are dominated by the player's move; comedy, not analysis.
- [Slow-play timer leaking across rematch/unmount] → timer owned by `useTrashTalk` with cleanup tied to game generation, mirroring the generation pattern already used in `useEngineOpponent`.
- [Bubble crowding small viewports] → bubble is placed in the status-bar row with max-width and never absolutely positioned over the board.
- [Profanity in shipped copy] → intentional per product owner; contained in `data/trashTalk.ts` if a "clean mode" is ever wanted.

## Open Questions

- Slow-play threshold value (initial: 30 s) and whether Hard should nag sooner — tune during playtest.
- Exact cp thresholds in D2 — tune during playtest; user will also supply more phrases to fold into the bank before or after implementation.
