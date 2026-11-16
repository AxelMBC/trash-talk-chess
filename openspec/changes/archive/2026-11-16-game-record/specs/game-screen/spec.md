## ADDED Requirements

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
