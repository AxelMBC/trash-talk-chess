## ADDED Requirements

### Requirement: Takeback keeps trash talk consistent
When the player takes back a move, the system SHALL clear the line on screen without showing a new one, judge the player's next move against the evaluation of the restored position rather than the undone one, keep the session's blunder count and said-line history, and restart the slow-play timer and think-time stopwatch; viewing earlier positions SHALL never trigger, clear or change a line.

#### Scenario: Line clears
- **WHEN** the player takes back while a line is showing
- **THEN** the line disappears and no line appears until the next move lands or the slow-play threshold is reached

#### Scenario: Next verdict uses the restored position
- **WHEN** the player blunders, takes the move back and then plays a quiet move that keeps the position level
- **THEN** the verdict on the new move is not "good" merely because the position is better than after the undone blunder

#### Scenario: Takeback to the starting position
- **WHEN** the player takes back their first move and moves again
- **THEN** the new move is judged as a first move is in a fresh game

#### Scenario: Blunders stay on the record
- **WHEN** the player takes back a move that was counted as a blunder
- **THEN** the blunder count is unchanged and escalation lines it earned stay eligible

#### Scenario: Slow-play restarts
- **WHEN** the player takes back after the slow-play nag has already fired on this turn
- **THEN** the slow-play timer starts again from the takeback

#### Scenario: Browsing is silent
- **WHEN** the player steps through earlier positions
- **THEN** the line on screen, its remaining display time and the session stats are unaffected
