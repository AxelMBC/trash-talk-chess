# ai-opponent Specification (delta)

## ADDED Requirements

### Requirement: vs Computer entry in the main menu
The main menu SHALL offer a "vs Computer" game mode alongside the existing local pass-and-play option, with a difficulty selector offering exactly three named levels (Easy, Medium, Hard) defaulting to Medium.

#### Scenario: Start a vs-computer game
- **WHEN** the player selects a difficulty and activates "vs Computer"
- **THEN** a game screen opens in vs-computer mode with the chosen difficulty, the human playing White and the engine playing Black

#### Scenario: Default difficulty
- **WHEN** the player activates "vs Computer" without touching the difficulty selector
- **THEN** the game starts at Medium difficulty

### Requirement: Engine plays the opposing side
In a vs-computer game, whenever it becomes the engine's turn and the game is not over, the system SHALL obtain a legal move from the chess engine and play it through the same move pipeline as human moves, so that piece glide, capture, check highlight, and game-over behavior are identical to a human-played move.

#### Scenario: Engine replies to a player move
- **WHEN** the player completes a legal move and the game is not over
- **THEN** the engine plays a legal reply, animated like a human move, and the turn returns to the player

#### Scenario: Engine move ends the game
- **WHEN** the engine's move delivers checkmate, stalemate, or a draw
- **THEN** the existing game-over flow (overlay, celebration) triggers exactly as it does in pass-and-play

#### Scenario: Engine promotion needs no dialog
- **WHEN** the engine's chosen move is a pawn promotion
- **THEN** the promotion is applied immediately with the engine's chosen piece and the promotion dialog never appears

### Requirement: Difficulty presets control engine strength
The system SHALL configure the engine per selected difficulty using fixed presets (skill level, search depth cap, and think-time cap), where Easy is measurably weaker than Medium, and Medium weaker than Hard.

#### Scenario: Preset applied at game start
- **WHEN** a vs-computer game starts at a given difficulty
- **THEN** the engine is configured with that difficulty's preset before its first move, and the preset remains in effect for the whole game

### Requirement: Input locked while the engine acts
The system SHALL ignore board input from the human player whenever it is the engine's turn or the engine is still loading, and SHALL indicate that the engine is thinking during that time.

#### Scenario: Click during engine turn
- **WHEN** the player clicks any square while the engine is thinking
- **THEN** the click has no effect on selection or moves

#### Scenario: Thinking indicator
- **WHEN** the engine is computing its move
- **THEN** the UI shows a visible thinking state for the engine's side, which clears once the engine's move is played

### Requirement: Engine replies feel deliberate
The engine's move SHALL NOT be applied to the board sooner than a short minimum delay (~400 ms) after the player's move completes, so replies never appear instantaneous, while still honoring the difficulty preset's think-time cap as an upper bound plus that minimum.

#### Scenario: Instant engine result
- **WHEN** the engine returns its move faster than the minimum delay
- **THEN** the move is played only after the minimum delay has elapsed

### Requirement: Engine failure never freezes the game
If the engine fails to load, fails its startup handshake within a timeout, or fails to produce a move, the system SHALL present a user-visible error state with a way back to the main menu, and SHALL NOT leave the board in a state that appears playable but is unresponsive.

#### Scenario: Engine fails to load
- **WHEN** the engine worker or its WASM binary fails to load at the start of a vs-computer game
- **THEN** an error message is shown with a "Back to menu" action instead of the game silently hanging

#### Scenario: Engine fails mid-game
- **WHEN** the engine fails to produce a move during an active game
- **THEN** the same user-visible error state is shown

### Requirement: Engine lifecycle across rematch and exit
Starting a rematch SHALL reset the engine for a new game under the same difficulty, and leaving the game screen SHALL terminate the engine worker. A move computed for a previous game SHALL never be applied to a new game.

#### Scenario: Rematch
- **WHEN** the player starts a rematch in a vs-computer game
- **THEN** the board resets, the engine is reset for a new game at the same difficulty, and play proceeds normally

#### Scenario: Stale engine move discarded
- **WHEN** the engine finishes computing a move for a game that has since been reset or exited
- **THEN** that move is discarded and never applied to the current board

#### Scenario: Exit to menu
- **WHEN** the player exits to the main menu from a vs-computer game
- **THEN** the engine worker is terminated and no engine activity continues in the background
