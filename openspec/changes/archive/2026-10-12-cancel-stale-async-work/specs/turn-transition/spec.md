## MODIFIED Requirements

### Requirement: Transition state resets on new game
Starting a new game (rematch) SHALL cancel any in-progress transition and reset the board to white's orientation at rest (0° rotation, full scale) without playing the turn-change animation.

#### Scenario: Rematch during or after a game
- **WHEN** the player starts a rematch
- **THEN** the board shows white's orientation at rest and input is enabled

#### Scenario: Rematch while a turn is still pending
- **WHEN** the player starts a rematch while a turn-change transition is still pending or running, whichever side moved last
- **THEN** the transition stops at once, the board stays at rest in white's orientation, and no lift or rotation plays afterwards
