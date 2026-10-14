## Why

The menu and game screens now share the rook-riot sticker style, but the scouting report is still the old generated layout: a gold glow, a gradient roast box, flat MUI cards, chips, and a stock spinner while chess.com data loads. The tabloid mockup was dropped because the user's other project, combat-atlas, already uses a newspaper look (Anton over off-white paper, Georgia serif, a red accent). The report needs its own object.

## What Changes

- Present the scouted player as a collectible player card on the menu's full-color rook collage:
  - The card's color tier and "spirit piece" come from the player's best current rating, from Common (Pawn) to Legendary (Queen).
  - A rating badge, a type line (main time control, years on chess.com, lifetime games) and a six-number stat box.
  - The first roast is printed as the card's flavor text.
  - A sticker on the card's edge shows the current streak when it is three games or longer.
- Move the rest of the dossier into the game screen's dark sticker panels: ratings as tier-colored chips, recent form as a win/loss bar plus loss-ending and win-ending bars, and favourite openings as "Signature moves".
- Show the remaining roasts as Stockfish's paper speech bubbles beside a Stockfish name plate, the same voice as in-game.
- Replace the spinner and bare progress bar with a printing sequence:
  - A face-down card bobs gently.
  - Three sticker steps tick off: profile found, ratings pulled, digging through games.
  - The games step carries a striped progress bar with the archive and game counts.
  - When a fresh dossier arrives, the card flips face up. A cached report lands face up with no flip.
- Restyle the error states: "user not found" shows an empty card slot; network failures show the same frame with Retry.
- Replace the glow background, `Paper` sections and chips with the sticker style. Every animation respects reduced motion.
- Fix `RookCollage`'s fixed `<symbol>` id: the card art shows a second collage at the same time as the page's.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `scouting-report-ui`: adds requirements for the player card, the report panels and background, the loading sequence, and the error-state presentation. Its existing requirements (username entry, loading with progress, report contents, error recovery) stay true as written.

## Out of Scope

- The player's chess.com avatar on the card: the dossier doesn't store it, and adding it means a schema bump.
- Using the card tier or spirit piece in trash talk.
- New or changed roast copy.
- Any newspaper device: no paper sheet, masthead, column rules, serif type or rubber stamp.

## Impact

- `src/hooks/useScoutingReport.ts`: the loading state gains a `stage` (`'profile' | 'ratings' | 'games'`).
- `src/components/ScoutingReport/ScoutingReport.tsx`: new layout, panels, loading and error views.
- New `src/components/PlayerCard/`: the card (front, flip) plus `cardFacts.ts` with the badge and stat derivations.
- New `src/components/CardBack/`: the card back, shared by the flip and the loading view.
- New `src/theme/card.ts`: card tiers and face constants; new `src/utils/timeClass.ts`: time class labels.
- New `src/components/ScoutingProgress/`: the printing sequence.
- `src/data/roasts.ts`: `bestCurrentRating` moves to `src/services/dossier.ts` so the card can share it.
- `src/components/RookCollage/RookCollage.tsx`: per-instance symbol id.
- No new dependencies.
