## MODIFIED Requirements

### Requirement: vs Computer entry in the main menu
The main menu SHALL offer a "vs Computer" game mode alongside the existing local pass-and-play option as an equal-size entry, and activating "vs Computer" SHALL replace that entry in place with exactly three named difficulty levels (Easy, Medium, Hard) plus a back action, where choosing a level starts the game at that difficulty.

#### Scenario: Equal mode entries
- **WHEN** the main menu is shown
- **THEN** the Local and "vs Computer" entries are the same size and no difficulty levels are visible

#### Scenario: Reveal difficulty levels
- **WHEN** the player activates "vs Computer"
- **THEN** the entry is replaced in place by Easy, Medium and Hard plus a back action, without shifting the rest of the menu, and no game starts yet

#### Scenario: Start a vs-computer game
- **WHEN** the player chooses a difficulty level
- **THEN** a game screen opens in vs-computer mode with the chosen difficulty, the human playing White and the engine playing Black

#### Scenario: Back out of level selection
- **WHEN** the levels are shown and the player activates the back action, or presses Escape while keyboard focus is on one of the level controls
- **THEN** the "vs Computer" entry is restored and no game starts
