# turn-transition Specification (delta)

## MODIFIED Requirements

### Requirement: Continuous seamless board rotation on turn change
When the turn changes during an active local **pass-and-play** game, the system SHALL reorient the board to face the player to move using a single continuous 180° in-plane rotation. The board SHALL remain fully visible for the entire transition, and the final animated frame SHALL be visually identical to the post-swap render so that no realignment, snap, or teleport of squares or pieces is ever visible. This rotation applies only to pass-and-play games; vs-computer games are exempt.

#### Scenario: Board rotates after a move
- **WHEN** a player completes a legal move in a pass-and-play game and the game is not over
- **THEN** the board rotates 180° in the screen plane and ends oriented toward the player to move, with every piece on its correct square

#### Scenario: No hidden swap frame
- **WHEN** the rotation completes and the internal orientation state is swapped
- **THEN** no on-screen element changes position or appearance in the frame where the swap occurs

#### Scenario: No transition at game end
- **WHEN** a move ends the game (checkmate, stalemate, or draw)
- **THEN** the board does not rotate and remains in its current orientation

#### Scenario: No rotation in vs-computer games
- **WHEN** the turn changes during a vs-computer game
- **THEN** the board does not rotate, lift, or settle, and no input lockout from the transition system occurs

## ADDED Requirements

### Requirement: Fixed orientation in vs-computer games
In a vs-computer game, the board SHALL remain oriented toward the human player's color for the entire game, including at game start, after every move by either side, after rematch, and regardless of reduced-motion settings.

#### Scenario: Orientation constant across engine moves
- **WHEN** the engine completes a move in a vs-computer game
- **THEN** the board orientation is unchanged and still faces the human player

#### Scenario: Rematch in vs-computer mode
- **WHEN** the player starts a rematch in a vs-computer game
- **THEN** the board resets already oriented toward the human player's color with no transition animation
