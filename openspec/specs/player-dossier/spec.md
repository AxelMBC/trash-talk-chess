# player-dossier Specification

## Purpose
Derive a serializable, cacheable `PlayerDossier` from fetched chess.com data — a career summary plus recent-games analysis — tolerating sparse accounts and supporting explicit re-scouts.

## Requirements

### Requirement: Career summary derivation
The system SHALL derive a career-wide `CareerSummary` from the profile and stats responses alone (no archive downloads), including: account age (from `joined`), lifetime game count (sum of win/loss/draw records across time controls), and per-time-control current rating, best rating, and record.

#### Scenario: Long-time low-rated player
- **WHEN** the profile shows the account is 10 years old and stats show a current rapid rating under 1000
- **THEN** the career summary exposes both facts (account age and current rating) so the report can deliver a long-horizon jab

#### Scenario: Career summary without archives
- **WHEN** a dossier is built
- **THEN** the career summary is computed exclusively from the profile and stats endpoints, with no monthly archive requests attributed to it

### Requirement: Recent-games analysis
The system SHALL derive a `RecentGamesAnalysis` from the collected last-100 games, including: win/loss/draw counts from the player's perspective; a breakdown of how the player's losses ended (checkmated, resigned, timeout, abandoned) and how their wins ended; the player's most-played openings with counts (from PGN ECO/ECOUrl headers); longest loss streak and current streak; average accuracy across games where chess.com provides `accuracies`; and the player's most-played time control within the sample.

#### Scenario: Analysis over a full sample
- **WHEN** 100 games are collected for a player
- **THEN** the analysis reports W/L/D totals that sum to 100, termination breakdowns consistent with those totals, and at least one top opening if any game carried an ECO header

#### Scenario: Accuracy data partially missing
- **WHEN** only some collected games include `accuracies`
- **THEN** average accuracy is computed over just those games and the count of games it is based on is included, and when no games have accuracies the field is absent rather than zero

#### Scenario: Opening headers missing
- **WHEN** collected games lack ECO/ECOUrl headers
- **THEN** those games are skipped for opening stats and the analysis still succeeds

### Requirement: Dossier assembly and serializability
The system SHALL assemble a `PlayerDossier` containing `schemaVersion`, `username`, `fetchedAt`, the career summary, and the recent-games analysis. The dossier MUST be plain-JSON serializable (survive `JSON.parse(JSON.stringify(d))` without loss).

#### Scenario: Round-trip serialization
- **WHEN** a dossier is serialized to JSON and parsed back
- **THEN** the result is deep-equal to the original

### Requirement: localStorage caching
The system SHALL persist the dossier to `localStorage` under the key `ttc:dossier:<lowercased-username>` and SHALL serve a cached dossier without network requests on subsequent lookups. A cached dossier whose `schemaVersion` differs from the current version SHALL be treated as a cache miss.

#### Scenario: Cache hit
- **WHEN** a username with a cached dossier is scouted again
- **THEN** the cached dossier is returned immediately and no chess.com requests are made

#### Scenario: Stale schema version
- **WHEN** the cached dossier's `schemaVersion` does not match the current one
- **THEN** the cache entry is ignored and a fresh scout runs

### Requirement: Re-scout refresh
The system SHALL support an explicit re-scout that bypasses the cache, refetches from chess.com, rebuilds the dossier, and overwrites the cached entry.

#### Scenario: Manual refresh
- **WHEN** the user triggers re-scout for a cached username
- **THEN** fresh data is fetched and the localStorage entry is replaced with the new dossier and a new `fetchedAt`

### Requirement: Sparse-data tolerance
The system SHALL build a valid dossier for accounts with fewer than 100 games, zero games, or missing time-control stats, marking absent signals as absent rather than failing.

#### Scenario: Brand-new account
- **WHEN** the scouted account has no completed games
- **THEN** a dossier is still produced with an empty recent-games analysis and whatever career facts exist, and the UI layer can detect the emptiness
