## ADDED Requirements

### Requirement: Fetch player profile and stats
The system SHALL fetch a player's profile (`/pub/player/{username}`) and stats (`/pub/player/{username}/stats`) from the chess.com published-data API using browser `fetch`, and SHALL expose them as typed objects including join date, and per-time-control current rating, best rating, and win/loss/draw record.

#### Scenario: Valid username returns profile and stats
- **WHEN** a scout is requested for an existing chess.com username
- **THEN** the client returns the player's profile (including `joined` timestamp) and stats (including ratings and records for each time control the player has played)

#### Scenario: Time control never played
- **WHEN** the stats response omits a time-control block (e.g. the player has never played daily)
- **THEN** the typed stats object represents that time control as absent rather than failing

### Requirement: Collect the last 100 games
The system SHALL collect the player's most recent games by fetching the archive list (`/games/archives`) and then monthly archives from newest to oldest, accumulating games in reverse-chronological order until 100 standard-rules games are collected or all archives are exhausted. Games with `rules` other than `chess` (variants) SHALL be excluded.

#### Scenario: Player with more than 100 games
- **WHEN** the player's recent archives contain more than 100 standard games
- **THEN** exactly the 100 most recent standard games are returned and no older archives are fetched once the quota is reached

#### Scenario: Player with fewer than 100 games
- **WHEN** the player has fewer than 100 standard games in total
- **THEN** all of their standard games are returned without error

#### Scenario: Variant games excluded
- **WHEN** a monthly archive contains Chess960 or other variant games
- **THEN** those games do not count toward or appear in the collected 100

### Requirement: Serial request pacing with progress
The system SHALL issue archive requests one at a time (never in parallel) and SHALL report progress after each completed archive fetch so the UI can display it.

#### Scenario: Multiple archives needed
- **WHEN** collecting 100 games requires fetching three monthly archives
- **THEN** the three requests occur sequentially and a progress callback fires after each one

### Requirement: Typed error handling
The system SHALL distinguish error cases as typed results: unknown user (HTTP 404 on the profile), rate limiting (HTTP 429), and network/other failures. Errors SHALL be returned to the caller rather than thrown as unhandled exceptions.

#### Scenario: Unknown username
- **WHEN** the profile request returns 404
- **THEN** the client yields a "user not found" error type identifiable by the UI, and no further requests are made for that scout

#### Scenario: Network failure mid-collection
- **WHEN** an archive request fails after some games were already collected
- **THEN** the client yields a network error type and does not return a silently truncated result as success
