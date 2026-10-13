## MODIFIED Requirements

### Requirement: Session memory enables escalation
The system SHALL track per-game session stats — at minimum the player's blunder count and the lines already said — resetting them on every rematch, whether or not any move has been played. Escalation lines that reference session stats (e.g., cumulative blunders) SHALL only appear when the stats make them true.

#### Scenario: Escalation line is earned
- **WHEN** an escalation line referencing N blunders is displayed
- **THEN** the player has made at least N bad moves this game

#### Scenario: Rematch wipes the session
- **WHEN** the player starts a rematch
- **THEN** blunder counts and said-line history reset, and previously said lines become available again

#### Scenario: Rematch before the first move
- **WHEN** the player starts a rematch before any move has been played, for example while a slow-play line is showing
- **THEN** the line on screen clears, the session resets, and the slow-play timer and think-time stopwatch restart from the new game's start
