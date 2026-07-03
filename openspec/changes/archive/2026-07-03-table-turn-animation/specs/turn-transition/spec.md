# turn-transition Specification

## ADDED Requirements

### Requirement: Continuous seamless board rotation on turn change
When the turn changes during an active local game, the system SHALL reorient the board to face the player to move using a single continuous 180° in-plane rotation. The board SHALL remain fully visible for the entire transition, and the final animated frame SHALL be visually identical to the post-swap render so that no realignment, snap, or teleport of squares or pieces is ever visible.

#### Scenario: Board rotates after a move
- **WHEN** a player completes a legal move and the game is not over
- **THEN** the board rotates 180° in the screen plane and ends oriented toward the player to move, with every piece on its correct square

#### Scenario: No hidden swap frame
- **WHEN** the rotation completes and the internal orientation state is swapped
- **THEN** no on-screen element changes position or appearance in the frame where the swap occurs

#### Scenario: No transition at game end
- **WHEN** a move ends the game (checkmate, stalemate, or draw)
- **THEN** the board does not rotate and remains in its current orientation

### Requirement: Pieces stay upright during rotation
Piece glyphs SHALL counter-rotate around their own centers during the board rotation so that every glyph remains upright (0° net rotation) at all times, including at the start, throughout, and at the end of the transition.

#### Scenario: Glyphs upright mid-rotation
- **WHEN** the board is at any intermediate rotation angle during the transition
- **THEN** every piece glyph is rendered upright while its position follows the rotating board

### Requirement: Lift and settle framing
The transition SHALL begin with a subtle lift (slight scale-down with optional 3D tilt) and end with a spring settle back to rest, giving the motion a clear beginning and end without introducing any positional snap.

#### Scenario: Transition has weight
- **WHEN** the rotation starts
- **THEN** the board scales down slightly before or while rotating, and springs back to full scale as the rotation completes

### Requirement: Move glide and rotation read as one gesture
The rotation SHALL begin while or immediately after the moved piece's glide animation finishes, without a perceptible dead pause between the move and the rotation.

#### Scenario: No dead pause after a move
- **WHEN** a piece finishes gliding to its destination square
- **THEN** the board rotation is already starting or starts within a short overlap window, not after a fixed long delay

### Requirement: Coordinate labels fade during rotation
File and rank labels SHALL fade out near the start of the rotation and fade back in after the orientation swap, so their content change is never visible.

#### Scenario: Labels never visibly snap
- **WHEN** the board rotates and the orientation swaps
- **THEN** labels are not visible at the moment their text changes, and they fade back in showing the correct labels for the new orientation

### Requirement: Input locked during transition
The system SHALL ignore board input from the start of the turn-change transition until the settle completes.

#### Scenario: Click during rotation
- **WHEN** a player clicks a square while the board is rotating or settling
- **THEN** the click has no effect on selection or moves

### Requirement: Reduced motion fallback
When the user's system requests reduced motion, the system SHALL swap the orientation instantly with no rotation, lift, or settle animation.

#### Scenario: Reduced motion swap
- **WHEN** `prefers-reduced-motion` is active and the turn changes
- **THEN** the board re-renders in the new orientation immediately without animating

### Requirement: Transition state resets on new game
Starting a new game (rematch) SHALL cancel any in-progress transition and reset the board to white's orientation at rest (0° rotation, full scale) without playing the turn-change animation.

#### Scenario: Rematch during or after a game
- **WHEN** the player starts a rematch
- **THEN** the board shows white's orientation at rest and input is enabled
