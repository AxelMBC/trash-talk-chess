# game-record

## Purpose

The record of the game in progress: every move played in standard notation, viewing any earlier position without touching the live game, taking back the human's last move and the computer's reply, and asking before a game in progress is discarded.

## Requirements

### Requirement: Move record
The system SHALL keep the ordered record of every move played in the current game, in both local and vs-computer games, adding each move as it lands and emptying the record on a rematch.

#### Scenario: Move lands
- **WHEN** a human or the engine completes a legal move
- **THEN** the record grows by exactly that move, in standard algebraic notation, after all earlier moves

#### Scenario: Special moves
- **WHEN** a castle, an en passant capture, a promotion, a check or a checkmate is played
- **THEN** its record entry uses the standard notation for that move (for example `O-O`, `exd6`, `e8=Q`, `Qh5+`, `Qxf7#`)

#### Scenario: Rematch
- **WHEN** the player starts a rematch
- **THEN** the record is empty

### Requirement: Viewing earlier positions
The system SHALL let the player view the position after any recorded move, or the starting position, without changing the live game: the board shows the viewed position with that move's highlight and check marker, pieces glide between viewed positions as they do for a played move, and no move can be made until the view is back on the live position.

#### Scenario: Step back
- **WHEN** the player steps back one move from the live position
- **THEN** the board shows the position before the latest move, the pieces involved glide back to their earlier squares, a piece captured by that move reappears, and the previous move is highlighted

#### Scenario: Jump to a move
- **WHEN** the player picks a move in the record
- **THEN** the board shows the position right after that move

#### Scenario: Starting position
- **WHEN** the player steps back past the first move
- **THEN** the board shows the starting position with no move highlighted

#### Scenario: Board is read-only in the past
- **WHEN** the player clicks a square while viewing an earlier position
- **THEN** no piece is selected and no move is made

#### Scenario: Live game is untouched
- **WHEN** the player views an earlier position and then returns to the live position
- **THEN** the turn, the captured pieces, the engine's activity and the game's result are the same as if the player had never looked back

#### Scenario: New move returns to live
- **WHEN** a move lands while the player is viewing an earlier position, for example the engine's reply
- **THEN** the view returns to the live position and shows that move

#### Scenario: Keyboard
- **WHEN** the player presses the left or right arrow key while no dialog is open and focus is not in a text field
- **THEN** the view steps one move back or forward

#### Scenario: Table turn in progress
- **WHEN** the board is turning between players in a local game
- **THEN** the view cannot be changed until the turn finishes

#### Scenario: Game over
- **WHEN** the game has ended and the player steps back with the arrow keys
- **THEN** the board behind the game-over overlay shows the earlier position, and every recorded position can be reached

### Requirement: Takeback against the computer
In a vs-computer game the system SHALL offer a takeback that undoes the human's most recent move together with the engine's reply to it, available only while it is the human's turn, the engine is idle, the game is not over, the view is on the live position and the human has made at least one move.

#### Scenario: Take back a move
- **WHEN** the human takes back with it being their turn
- **THEN** the board returns to the position before their last move, the pieces glide back, pieces captured by the two undone moves return to the board and leave the capture plates, the two moves leave the record, and it is the human's turn

#### Scenario: Repeated takeback
- **WHEN** the human takes back several times in a row
- **THEN** each takeback undoes one more of their moves and the engine's reply, down to the starting position

#### Scenario: Nothing to take back
- **WHEN** the human has not moved yet in this game
- **THEN** the takeback is unavailable

#### Scenario: Engine's turn
- **WHEN** the engine is loading or thinking
- **THEN** the takeback is unavailable

#### Scenario: Engine does not replay
- **WHEN** a takeback completes
- **THEN** the engine makes no move until the human moves again

#### Scenario: Local game
- **WHEN** a local pass-and-play game is shown
- **THEN** no takeback is offered

### Requirement: Confirmation before discarding a game
The system SHALL ask the player to confirm before "New game" or the exit to the main menu discards a game in which at least one move has been played and which has not ended, and SHALL act at once when no move has been played or the game is over.

#### Scenario: New game mid-game
- **WHEN** the player activates "New game" after at least one move in an unfinished game
- **THEN** a confirmation appears and the game continues unchanged until the player confirms

#### Scenario: Confirm
- **WHEN** the player confirms
- **THEN** the pending action runs: the game resets, or the app returns to the main menu

#### Scenario: Cancel
- **WHEN** the player cancels the confirmation or presses Escape
- **THEN** the confirmation closes and the game is exactly as it was

#### Scenario: Nothing to lose
- **WHEN** the player activates "New game" or the menu exit before any move has been played
- **THEN** the action runs with no confirmation

#### Scenario: Finished game
- **WHEN** the game is over and the player chooses Rematch, Main Menu, "New game" or the menu exit
- **THEN** the action runs with no confirmation
