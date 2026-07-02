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
While a scout is fetching, the UI SHALL show a loading state that reflects archive-fetch progress and SHALL prevent submitting a concurrent scout.

#### Scenario: Multi-archive download
- **WHEN** the collector is fetching several monthly archives
- **THEN** the loading state updates as each archive completes and the scout action remains disabled until the flow ends

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
