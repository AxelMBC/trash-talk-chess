# scouting-report-ui Specification

## Purpose
Provide the user-facing scouting flow: username entry on the main menu, a progress-aware loading state, a scouting report screen that renders the dossier with roast lines, and recoverable error states.

## Requirements

### Requirement: Username entry on the main menu
The main menu SHALL provide a chess.com username input and a scout action alongside the existing Local game option. Submitting a username SHALL start the scouting flow; an empty or whitespace-only input SHALL not.

#### Scenario: Submitting a username
- **WHEN** the user enters a username and triggers the scout action (button or Enter key)
- **THEN** the app begins scouting and navigates toward the scouting report screen

#### Scenario: Empty input
- **WHEN** the input is empty or whitespace
- **THEN** the scout action is disabled or inert and no request is made

### Requirement: Loading state with progress
While a scout is fetching, the UI SHALL show a loading state that reflects archive-fetch progress and SHALL prevent submitting a concurrent scout. Leaving the scouting screen SHALL abandon the scout in flight: its requests are cancelled and it never updates the cached dossier, the remembered scouted player or the UI.

#### Scenario: Multi-archive download
- **WHEN** the collector is fetching several monthly archives
- **THEN** the loading state updates as each archive completes and the scout action remains disabled until the flow ends

#### Scenario: Leaving mid-scout
- **WHEN** the user returns to the main menu while a scout of one player is still fetching, then scouts another player
- **THEN** the first scout's requests stop, and the second player is the one remembered for trash talk

### Requirement: Scouting report screen
The app SHALL add a `scouting` screen (new `ScreenName`) that renders the dossier: career facts (account age, lifetime games, ratings), recent-form stats (W/L/D, termination breakdown, streaks, top openings, accuracy when available, preferred time control), and static roast lines selected from the dossier by threshold rules. The screen SHALL show when the dossier was fetched and provide a re-scout action and a way back to the main menu.

#### Scenario: Rendering a full dossier
- **WHEN** a dossier with career and recent data is ready
- **THEN** the report displays career facts, recent-form stats, and at least one roast line derived from the dossier's actual values

#### Scenario: Cached dossier fast path
- **WHEN** the user scouts a username that has a valid cached dossier
- **THEN** the report renders without a loading phase and indicates how long ago it was scouted

#### Scenario: Re-scout from the report
- **WHEN** the user triggers the re-scout action
- **THEN** the loading state runs and the report re-renders with the refreshed dossier

#### Scenario: Empty account roast
- **WHEN** the dossier has no recent games
- **THEN** the report shows a roast line about the emptiness instead of empty stat sections

### Requirement: Error states
The UI SHALL present distinct, recoverable error states for unknown users and network/rate-limit failures, allowing the user to correct the username or retry without reloading the app.

#### Scenario: Unknown user
- **WHEN** the scout fails with the "user not found" error
- **THEN** a message makes clear the username doesn't exist on chess.com and the user can edit the input and retry

#### Scenario: Network failure
- **WHEN** the scout fails from a network or rate-limit error
- **THEN** a retry affordance is shown and a retry re-runs the scout

### Requirement: Player card
The scouting report SHALL present the scouted player as a collectible card whose color tier and spirit piece follow the player's best current rating (below 1000 or unrated: Common, Pawn; 1000–1399: Uncommon, Knight; 1400–1799: Rare, Bishop; 1800–2199: Epic, Rook; 2200 and above: Legendary, Queen), carrying the username as the screen's main heading, a rating badge, a type line, a six-number stat box, the first roast as flavor text, and a streak sticker when the current streak is three games or longer.

#### Scenario: Tier from rating
- **WHEN** a dossier's highest current rating across time controls is 863
- **THEN** the card is in the Common color, its art shows a Pawn, and its rarity ribbon reads "Common · Spirit piece: Pawn"

#### Scenario: Tier boundary
- **WHEN** a dossier's highest current rating is exactly 1400
- **THEN** the card is Rare with a Bishop

#### Scenario: Unrated player
- **WHEN** the dossier has no ratings in any time control
- **THEN** the card is Common with a Pawn and its rating badge shows a dash and "Unrated"

#### Scenario: Rating badge and type line
- **WHEN** the dossier has a preferred time control with a rating
- **THEN** the badge shows that time control's current rating and name, and the type line names that time control as the player's main, followed by years on chess.com and lifetime games

#### Scenario: Stat box
- **WHEN** a dossier with recent games is shown
- **THEN** the stat box shows the peak rating, recent win percentage, share of recent losses by resignation, average accuracy, current streak (for example "L5") and longest losing streak, with a dash for any value the dossier lacks

#### Scenario: Flavor text
- **WHEN** the card is shown
- **THEN** its flavor text is the first roast line selected for the dossier

#### Scenario: Streak sticker
- **WHEN** the current streak is five losses
- **THEN** a sticker reading "5 losses in a row" is slapped on the card's edge, and no sticker appears for a streak shorter than three

#### Scenario: Heading for assistive technology
- **WHEN** a screen reader reads the report
- **THEN** the main heading is "Scouting report" followed by the username

### Requirement: Report panels and background
The scouting report SHALL show the menu's full-color rook collage fixed behind the page, hidden from assistive technology and never receiving input, and SHALL lay out the rest of the dossier on opaque sticker panels beside the card on wide screens and below it on narrow ones: ratings per time control as chips colored by that rating's tier, recent form as a win/draw/loss bar with loss-ending and win-ending bars, favourite openings as "Signature moves", and every roast after the first as a Stockfish speech bubble.

#### Scenario: Wide layout
- **WHEN** the report is shown at 1280px wide
- **THEN** the card sits in a left column and the panels stack in a right column

#### Scenario: Phone layout
- **WHEN** the report is shown at about 400px wide
- **THEN** the card comes first, the panels follow in one column, and the page does not scroll horizontally

#### Scenario: Collage stays put
- **WHEN** the player scrolls a long report
- **THEN** the collage stays fixed behind the page at the same scale instead of stretching with the content

#### Scenario: Stockfish's take
- **WHEN** more than one roast line is selected
- **THEN** every line after the first appears as a paper speech bubble beside a "Stockfish" name plate, and with a single roast that panel is not shown

#### Scenario: Empty account
- **WHEN** the dossier has no recent games
- **THEN** the card's flavor text is the empty-account roast, its recent stats show dashes, and one panel says there are no recent games in place of the recent-form and openings panels

### Requirement: Printing sequence while scouting
While a scout is fetching, the scouting screen SHALL show a face-down card with three steps (profile found, ratings pulled, digging through games) that tick off as each fetch completes, with the games step showing archives fetched, games collected and a progress bar, and SHALL flip the card face up when a freshly fetched dossier is ready, while a cached report appears face up without the sequence.

#### Scenario: Steps tick off
- **WHEN** the profile has loaded and the ratings are loading
- **THEN** the profile step shows as done, the ratings step as in progress, and the games step as waiting

#### Scenario: Archive progress
- **WHEN** the collector has fetched 3 of 8 archives and collected 37 of 100 games
- **THEN** the games step reads "Archive 3/8 · 37/100 games" and its bar is filled to 37%

#### Scenario: Reveal after a fresh scout
- **WHEN** a freshly fetched or re-scouted dossier becomes ready
- **THEN** the card turns over from its back to its front

#### Scenario: Cached report
- **WHEN** the scouted username has a valid cached dossier
- **THEN** the report appears with the card face up and no printing sequence or flip

#### Scenario: Reduced motion
- **WHEN** reduced motion is requested
- **THEN** the face-down card does not bob, the progress stripes do not move, and the report appears without the flip

### Requirement: Error-state presentation
The scouting screen's error states SHALL use the sticker style: an unknown user SHALL be shown as an empty dashed card slot with a "No card for <username>" title, the not-found explanation and a "Back to menu" sticker button, and a network or rate-limit failure SHALL use the same frame with a "Scouting failed" title, the error message, and Retry and "Back to menu" sticker buttons.

#### Scenario: Unknown user
- **WHEN** the scout fails because the user does not exist
- **THEN** an empty dashed card slot appears with "No card for" and the username, the explanation, and a "Back to menu" button

#### Scenario: Network failure
- **WHEN** the scout fails from a network or rate-limit error
- **THEN** the same frame shows "Scouting failed", the error message, and Retry and "Back to menu" buttons, and Retry runs the printing sequence again
