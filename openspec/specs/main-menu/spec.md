# main-menu

## Purpose

Define how the main menu looks and holds together: a static, deterministic rook collage behind the menu that never takes input, the title and controls kept legible on a solid panel over it, and the computer opponent's taunt attached to the vs Computer entry without changing its accessible name, covering a control or shifting the menu. What the entries do is covered by `ai-opponent` and `scouting-report-ui`.

## Requirements

### Requirement: Rook collage background
The main menu SHALL show a decorative background of overlapping chess rooks in varied colors, sizes and tilts that covers the whole viewport at any width, stays the same on every visit, never animates, is hidden from assistive technology and never receives pointer input.

#### Scenario: Menu at rest
- **WHEN** the main menu is shown
- **THEN** the background is a collage of rooks in several colors, some overlapping and some lying on their side, with no glow gradients and no floating pieces

#### Scenario: Same layout every visit
- **WHEN** the player leaves the menu and returns, or reloads the page
- **THEN** the rooks appear in the same positions, colors and tilts

#### Scenario: Reduced motion
- **WHEN** the main menu is shown with reduced motion requested
- **THEN** nothing on the menu moves: the collage is static and the title and panel appear without an entrance animation

#### Scenario: Phone width
- **WHEN** the main menu is shown at about 400px wide
- **THEN** the collage still fills the screen edge to edge and the page does not scroll horizontally

#### Scenario: Clicks pass through
- **WHEN** the player clicks or taps any part of the collage outside the menu controls
- **THEN** no rook receives the click and no control is activated

### Requirement: Menu legibility over the collage
The main menu SHALL keep its title and every control readable over the collage by darkening the collage toward the center and placing the mode entries, the scout row and the caption on one solid panel.

#### Scenario: Controls on a solid panel
- **WHEN** the main menu is shown
- **THEN** the Local and vs Computer entries, the username field, the Scout action and the caption sit on an opaque panel, with no rook visible through it

#### Scenario: Keyboard focus is visible
- **WHEN** the player moves focus through the menu with the keyboard
- **THEN** each focused control shows a visible focus indicator against the panel

### Requirement: Computer taunt on the vs Computer entry
The main menu SHALL show a speech bubble reading "Bold of you to show up." that points at the vs Computer entry as the computer's line, without changing that entry's accessible name, covering any other control, intercepting input, or shifting the menu when the entry swaps to difficulty levels.

#### Scenario: Taunt on the menu
- **WHEN** the main menu is shown
- **THEN** a speech bubble reading "Bold of you to show up." points at the vs Computer entry

#### Scenario: Taunt stays during level selection
- **WHEN** the player activates vs Computer and the difficulty levels replace the entry
- **THEN** the bubble stays in place, pointing at the level row, and neither the bubble nor the rest of the menu shifts

#### Scenario: Taunt never blocks a control
- **WHEN** the player clicks or taps where the bubble overlaps the panel or another control's surroundings
- **THEN** the click reaches whatever is under the bubble, and at every width the bubble covers no button or input

#### Scenario: Accessible name unchanged
- **WHEN** a screen reader announces the vs Computer entry
- **THEN** it is announced as "vs Computer", not with the taunt text
