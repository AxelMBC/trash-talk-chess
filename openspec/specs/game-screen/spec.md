# game-screen

## Purpose

Define how the game screen looks: a quiet, static version of the main menu's rook collage that keeps the board the brightest thing on screen, a sticker turn label worded for local or vs-computer play, player name plates that carry captures, material advantage and the engine's thinking state, an ink-framed board whose hard shadow keeps its direction through the table turn, and the sticker style of the screen's controls, promotion dialog and overlays. Game rules, the turn-transition motion, the engine and the trash-talk lines themselves are covered by `turn-transition`, `ai-opponent` and `live-trash-talk`.

## Requirements

### Requirement: Quiet rook background
The game screen SHALL show the main menu's rook collage pattern in a low-contrast dark palette behind the board that covers the whole viewport at any width, never animates, is hidden from assistive technology, never receives pointer input, and has no rook brighter or more saturated than the board's squares and highlights.

#### Scenario: Game at rest
- **WHEN** a local or vs-computer game is shown
- **THEN** the background shows the same rook arrangement as the main menu, in dark tones close to the backdrop, with no glow gradient

#### Scenario: Board stays the focus
- **WHEN** a square is selected or a last move is highlighted
- **THEN** no rook in the background shares the highlight's hue at a comparable brightness

#### Scenario: Static during play
- **WHEN** pieces glide, the board turns between players, or a trash-talk line appears
- **THEN** the background does not move

#### Scenario: Phone width
- **WHEN** the game screen is shown at about 400px wide
- **THEN** the background fills the screen edge to edge and the page does not scroll horizontally

### Requirement: Turn label
The game screen SHALL show whose turn it is as a sticker label in the display face, with a light surface when White is to move and a dark surface when Black is to move, reading "White to move" or "Black to move" in local games and "Your move" or "Stockfish's move" in vs-computer games, with a red "Check!" sticker attached while the side to move is in check, and the current move number beside it.

#### Scenario: Local turn change
- **WHEN** White moves in a local game
- **THEN** the label switches from a light "White to move" to a dark "Black to move"

#### Scenario: vs-computer wording
- **WHEN** it is the human's turn in a vs-computer game
- **THEN** the label reads "Your move", and after the human moves it reads "Stockfish's move" until the engine replies

#### Scenario: Check
- **WHEN** the side to move is in check
- **THEN** a red "Check!" sticker is attached to the turn label, and it disappears once the check is resolved

#### Scenario: Reduced motion
- **WHEN** the turn changes with reduced motion requested
- **THEN** the label changes instantly with no animation

### Requirement: Player name plates
The game screen SHALL show a name plate on each side of the board, on the side where that player's pieces start, carrying that player's captured pieces and material advantage, labelled "White" and "Black" in local games and "Stockfish · <difficulty>" for the engine and "You" for the human in vs-computer games, with the engine's plate showing its warming-up or thinking state while the engine loads or computes.

#### Scenario: Local plates follow the board
- **WHEN** the board turns toward the other player in a local game
- **THEN** the plates swap so each plate stays on its player's side of the board

#### Scenario: Engine plate
- **WHEN** a vs-computer game at Hard difficulty is shown
- **THEN** the plate across the board from the human reads "Stockfish · Hard" and the human's plate reads "You"

#### Scenario: Engine thinking
- **WHEN** the engine is loading or computing its move
- **THEN** the engine's plate shows a warming-up or thinking state, which clears once the engine's move is played

#### Scenario: Captures and advantage
- **WHEN** a player captures a piece
- **THEN** the captured piece appears on the capturing player's plate, and the material advantage appears there when that player is ahead

### Requirement: Board frame
The game screen SHALL frame the board with an ink border and a hard offset shadow that follows the board's outline at every rotation angle and always falls in the same screen direction, without changing the board's square colors, highlights or coordinate labels.

#### Scenario: Board at rest
- **WHEN** the game screen is shown
- **THEN** the board has a solid ink border and a sharp, unblurred shadow offset down and to the right

#### Scenario: Shadow during a table turn
- **WHEN** the board is partway through its turn between players in a local game
- **THEN** the shadow matches the rotated board's outline and still falls down and to the right, never showing as an upright square behind a tilted board

### Requirement: Sticker controls and overlays
The game screen's buttons, promotion dialog, game-over overlay and engine error overlay SHALL use the main menu's sticker style (ink borders, hard offset shadows, display-face titles with no gradient fill and no glows), and every control SHALL show a visible keyboard focus indicator.

#### Scenario: Screen controls
- **WHEN** the game screen is shown
- **THEN** a "← Menu" sticker button sits above the board and a "New game" sticker button sits below it, each pressing in when clicked

#### Scenario: Game over
- **WHEN** a game ends
- **THEN** the result title is set in the display face without a gradient fill, the winning king has no glow, the Rematch and Main Menu actions are sticker buttons, and any confetti uses the collage palette

#### Scenario: Promotion
- **WHEN** the promotion dialog opens
- **THEN** it is an opaque panel with an ink border and a hard shadow, and each piece choice is a sticker tile that presses in when chosen

#### Scenario: Engine error
- **WHEN** the engine fails and its error overlay is shown
- **THEN** the overlay's panel, title and "Back to menu" action use the sticker style

#### Scenario: Keyboard focus
- **WHEN** the player tabs through the game screen's controls, the promotion choices or an overlay's actions
- **THEN** each focused control shows a visible focus outline

### Requirement: Move list and record controls
The game screen SHALL show the move record as a list in the sticker style, numbered by full move with White's and Black's moves side by side, marking the move whose position the board is showing, keeping the newest move in sight as the game grows, with controls to step to the start, back, forward and to the live position, and a "Takeback" sticker button in vs-computer games; the list SHALL sit beside the board on wide viewports and as a single horizontally scrolling strip on narrow ones, and SHALL never move or resize the board as it fills.

#### Scenario: Empty record
- **WHEN** a game starts
- **THEN** the list's space is already reserved, it shows no moves, and the step controls are disabled

#### Scenario: Moves accumulate
- **WHEN** moves are played beyond what the list can show at once
- **THEN** the list scrolls on its own to keep the newest move visible, and the board keeps its size and position

#### Scenario: Current move marker
- **WHEN** the board shows the live position
- **THEN** the latest move is marked in the list, and when the player views an earlier position that move is marked instead

#### Scenario: Viewing the past is obvious
- **WHEN** the board shows an earlier position
- **THEN** the control that returns to the live position is visibly emphasized

#### Scenario: Wide viewport
- **WHEN** the game screen is shown on a viewport wide enough for the board and the list side by side
- **THEN** the list is a column beside the board and the board stays horizontally centered

#### Scenario: Phone width
- **WHEN** the game screen is shown at about 400px wide
- **THEN** the list is a one-row strip that scrolls horizontally inside itself, and the page does not scroll horizontally

#### Scenario: Takeback button
- **WHEN** a vs-computer game is shown
- **THEN** a "Takeback" sticker button is present, disabled whenever a takeback is unavailable, and absent in local games

#### Scenario: Keyboard focus
- **WHEN** the player tabs through the moves and the step controls
- **THEN** each is reachable and shows a visible focus outline

#### Scenario: Reduced motion
- **WHEN** the list scrolls to a new move with reduced motion requested
- **THEN** it jumps without a smooth scroll
