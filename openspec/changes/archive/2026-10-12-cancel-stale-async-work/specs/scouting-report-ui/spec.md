## MODIFIED Requirements

### Requirement: Loading state with progress
While a scout is fetching, the UI SHALL show a loading state that reflects archive-fetch progress and SHALL prevent submitting a concurrent scout. Leaving the scouting screen SHALL abandon the scout in flight: its requests are cancelled and it never updates the cached dossier, the remembered scouted player or the UI.

#### Scenario: Multi-archive download
- **WHEN** the collector is fetching several monthly archives
- **THEN** the loading state updates as each archive completes and the scout action remains disabled until the flow ends

#### Scenario: Leaving mid-scout
- **WHEN** the user returns to the main menu while a scout of one player is still fetching, then scouts another player
- **THEN** the first scout's requests stop, and the second player is the one remembered for trash talk
