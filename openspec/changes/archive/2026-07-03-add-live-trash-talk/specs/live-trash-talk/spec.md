# live-trash-talk Specification (delta)

## ADDED Requirements

### Requirement: One line per move, anchored to a move
In a vs-computer game, the system SHALL display at most one trash-talk line per completed move, and every line (except the slow-play nag) SHALL appear at the moment a move lands on the board — never detached from one. Event lines appear when the player's showy move lands; quality lines for quiet player moves appear together with the engine's reply; the engine's own move receives a taunt only when the player's move already received its line at move time (so the reply moment never carries two lines). No trash-talk lines SHALL appear in pass-and-play games or outside an active vs-computer game.

#### Scenario: Quiet player move gets one line at the reply
- **WHEN** the player completes a quiet legal move and the engine replies
- **THEN** exactly one line (the quality verdict) appears with the reply, and no further line appears until the next move lands

#### Scenario: Showy player move gets its line, engine reply gets the taunt
- **WHEN** the player's move triggers an event line at move time and the engine then replies
- **THEN** the engine's reply carries exactly one taunt line

#### Scenario: No lines out of nowhere
- **WHEN** no move has landed since the last displayed line and the slow-play threshold has not been reached
- **THEN** no new line appears

#### Scenario: Pass-and-play stays quiet
- **WHEN** any move is made in a local pass-and-play game
- **THEN** no trash-talk line is displayed

### Requirement: Player-move lines react to objective move quality
The system SHALL classify each player move as bad, neutral, or good using an objective evaluation from the chess engine (change in position evaluation before vs. after the move, from the engine's perspective), and SHALL pick the reaction line from the category matching that classification: roasts for bad moves, bored jabs for neutral moves, grudging respect for good moves.

#### Scenario: Bad move gets roasted
- **WHEN** the player's move significantly worsens their position per the engine evaluation
- **THEN** the displayed line is a roast from the bad-move category (e.g., "My god you are bad at chess", "My fucking eyes!")

#### Scenario: Good move gets grudging respect
- **WHEN** the player's move is among the engine's preferred continuations or improves their position per the evaluation
- **THEN** the displayed line comes from the good-move category

#### Scenario: Neutral move gets a bored jab
- **WHEN** the player's move neither significantly helps nor hurts per the evaluation
- **THEN** the displayed line comes from the neutral category (e.g., "You are one hell of a boring player")

#### Scenario: Evaluation unavailable falls back gracefully
- **WHEN** the engine fails to produce an evaluation for a player move
- **THEN** a generic line is shown instead, and the game continues unaffected — the move pipeline SHALL never wait on or fail because of trash talk

### Requirement: Event-specific lines take priority
When a move matches a detectable special event — a fork by the player, a capture, a check, a promotion — the system SHALL prefer a line from that event's category over the generic quality category, so specialized lines (e.g., "That was a good move, I did not know an 800 knew how to fork") appear when they apply.

#### Scenario: Fork gets the fork line
- **WHEN** the player's move creates a fork (one piece attacking two or more higher-value or undefended pieces)
- **THEN** the displayed line comes from the fork category rather than the generic quality category

#### Scenario: No special event falls through
- **WHEN** the player's move matches no special event
- **THEN** the line is selected by move quality alone

### Requirement: Engine-move taunts hint at where the game is going
Engine-move lines SHALL be taunting/rage-bait one-liners, and when the engine's search reports a decisive assessment — a forced mate in N or an overwhelming advantage — the system SHALL prefer lines that reference it (e.g., "3 moves away and you will finally stop wasting my time" near mate, "You are fucked" when the position collapses). A forced-mate assessment SHALL win the reply moment's single line slot even over a pending quality verdict.

#### Scenario: Mate on the horizon
- **WHEN** the engine's move comes with a search result of forced mate in N for the engine
- **THEN** the line displayed at the reply references the approaching end (mate-flavored category), regardless of what the player's move deserved

#### Scenario: Ordinary engine move
- **WHEN** the engine's move carries no decisive assessment and the player's move already received its line at move time
- **THEN** a generic engine taunt is displayed (e.g., "This Shit's EASY BOY")

### Requirement: Difficulty-aware jabs
Lines MAY reference the selected difficulty, and the system SHALL only display a difficulty-referencing line when it matches the actual difficulty of the current game (e.g., "I do not know why you chose medium difficulty when you make moves like that" only on Medium).

#### Scenario: Difficulty line matches reality
- **WHEN** a difficulty-referencing line is displayed
- **THEN** the difficulty it names is the difficulty the current game was started with

### Requirement: Slow-play nag
When it is the player's turn and they have not moved within a slow-play threshold, the system SHALL display a line nagging them about speed (e.g., "Hey buddy, can you make your moves faster?"), at most once per turn.

#### Scenario: Player stalls
- **WHEN** the player's think time on a single turn exceeds the threshold
- **THEN** a slow-play line appears without requiring a move to trigger it

#### Scenario: Nag does not repeat within a turn
- **WHEN** the player continues thinking after a slow-play line has been shown on this turn
- **THEN** no additional slow-play line appears until a later turn

### Requirement: Timed speech-bubble presentation
Each line SHALL be presented in a speech-bubble-style element attributed to the engine opponent, appearing with a clean, natural entrance, remaining readable for approximately 10 seconds, then dismissing itself. A newly triggered line SHALL replace the current one immediately. The bubble SHALL never intercept or block board input, and reduced-motion settings SHALL be respected (instant show/hide, no animation).

#### Scenario: Line auto-dismisses
- **WHEN** a line has been displayed for ~10 seconds with no newer line
- **THEN** it disappears on its own with a clean exit

#### Scenario: New line replaces old
- **WHEN** a new line triggers while a previous one is still visible
- **THEN** the previous line is replaced by the new one without overlap or queuing delay

#### Scenario: Bubble never blocks play
- **WHEN** a line is visible and it is the player's turn
- **THEN** the player can click any square normally, including squares visually near or under the bubble

### Requirement: Lines come from a curated bank with session-level variety
Lines SHALL be sourced from a curated static phrase bank organized by trigger category, written as direct, funny one-liners. Selection SHALL NOT repeat a line already said in the current game while unsaid alternatives exist in the category, and SHALL never show the same line twice in a row even when the pool is exhausted.

#### Scenario: No repeats within a game
- **WHEN** a category is triggered and it still has lines not yet said this game
- **THEN** the selected line is one that has not been said this game

#### Scenario: Exhausted category falls back gracefully
- **WHEN** every line in a triggered category has already been said this game
- **THEN** a line is still shown (reusing said lines), but never the same line twice in a row

### Requirement: Structured moment payload feeds line selection
Every trash-talk trigger SHALL build a single structured moment object — containing at minimum the trigger category, difficulty, current FEN, the game's moves so far (PGN), the last move's SAN, the move-quality verdict, the detected event, the position advantage (as centipawns and as a plain-language label), mate distance when known, session stats, and the player profile when available — and the line source SHALL receive only this object, with no other coupling to game internals.

#### Scenario: Moment is self-contained
- **WHEN** a line source produces a line for any trigger
- **THEN** all information it used came from the moment object it was handed

### Requirement: Line source is asynchronous and swappable with static fallback
Line production SHALL be an asynchronous function of the moment (`(moment) → Promise<line>`) behind a single swap point. If a source fails or exceeds a short timeout, the system SHALL fall back to the static phrase bank, and a line resolving after a newer trigger SHALL be discarded. Line production SHALL never delay or block moves, input, or animations.

#### Scenario: Swapping in an LLM source
- **WHEN** the active line source is replaced by another implementation honoring the same interface
- **THEN** event detection, moment building, selection triggers, and the speech-bubble UI work unchanged

#### Scenario: Source failure falls back to the bank
- **WHEN** the active line source rejects or times out for a trigger
- **THEN** a static bank line for the same moment is shown instead, and the game is unaffected

#### Scenario: Stale line discarded
- **WHEN** a line resolves after a newer trigger has already requested a line
- **THEN** the stale line is never displayed

### Requirement: Persona document defines the voice
The AI's personality — identity, tone rules, style constraints, and canonical example lines — SHALL live in an authored markdown persona document shipped with the app, editable without code changes, and exposed to the line-source layer as the voice contract (the future LLM system prompt).

#### Scenario: Persona is available to line sources
- **WHEN** a line source needs the voice definition
- **THEN** the persona document's content is available to it as text

### Requirement: Player profile brief personalizes lines
When a chess.com scouting dossier for the most recently scouted player exists, the system SHALL derive a compact markdown profile brief plus structured facts (rating, account age, record, favorite opening, loss habits) and include them in every moment. Profile-referencing lines SHALL only be shown when the profile exists, and a missing or unparseable dossier SHALL simply mean no profile — never an error.

#### Scenario: Scouted player gets personal treatment
- **WHEN** a vs-computer game is played after a player has been scouted
- **THEN** moments carry the profile brief and profile-aware lines become eligible

#### Scenario: No scout, no problem
- **WHEN** no scouting dossier exists in the cache
- **THEN** moments carry no profile, profile-aware lines never appear, and everything else works normally

### Requirement: Session memory enables escalation
The system SHALL track per-game session stats — at minimum the player's blunder count and the lines already said — resetting them on rematch. Escalation lines that reference session stats (e.g., cumulative blunders) SHALL only appear when the stats make them true.

#### Scenario: Escalation line is earned
- **WHEN** an escalation line referencing N blunders is displayed
- **THEN** the player has made at least N bad moves this game

#### Scenario: Rematch wipes the session
- **WHEN** the player starts a rematch
- **THEN** blunder counts and said-line history reset, and previously said lines become available again
