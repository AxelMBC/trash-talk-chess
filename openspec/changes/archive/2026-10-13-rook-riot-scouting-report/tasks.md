# Restyle the scouting report as a collectible player card with a printing sequence while scouting

## 1. Groundwork

- [x] 1.1 Move `bestCurrentRating` from `src/data/roasts.ts` to `src/services/dossier.ts` as an export and import it back in `roasts.ts` (also replaced the identical private copy in `src/services/playerBrief.ts`)
- [x] 1.2 Make `RookCollage`'s symbol id per instance with `useId()` instead of the module constant
- [x] 1.3 Add `stage: 'profile' | 'ratings' | 'games'` to the loading state in `useScoutingReport`, advancing before `fetchStats` and before `collectRecentGames`, kept across progress updates

## 2. Player card

- [x] 2.1 Create `src/components/PlayerCard/` (`PlayerCard.tsx`, `PlayerCard.types.ts`, `index.ts`, `cardFacts.ts`)
- [x] 2.2 Implement `CARD_TIERS` and `cardTier` in `src/theme/card.ts`, and `cardBadge` and `cardStats` in `cardFacts.ts`, as specified in the design, with `'—'` for missing values
- [x] 2.3 Build the card front: `h1` with "Scouting report" and the username, rating badge, art window (quiet `RookCollage` plus the white spirit piece with a paper die-cut edge and hard shadow), rarity ribbon, type line, six-cell stat box, flavor text and footer with "No. <lifetime games>"
- [x] 2.4 Build `CardBack` in `src/components/CardBack/` (gold, paper rook, "Trash Talk Chess") for the flip and the loading view
- [x] 2.5 Add the streak sticker for streaks of three or more ("<n> losses/wins/draws in a row", orange, lime or cream)
- [x] 2.6 Implement `reveal`: `'flip'` mounts face down and springs `rotateY` 180 → 0 with the tilt on the outer slot; `'instant'` and reduced motion mount face up; the streak sticker slaps on after the flip

## 3. Printing sequence

- [x] 3.1 Create `src/components/ScoutingProgress/` with the face-down `CardBack` bobbing (static under reduced motion), "Printing <username>'s card", the "Digging through …" line, and three sticker steps driven by `stage`
- [x] 3.2 Give the games step "Archive a/b · g/target games" and a striped bar filled to `gamesCollected / target`, empty before the first progress update, with stripes static under reduced motion

## 4. Report screen

- [x] 4.1 Replace the glow background with the loud `RookCollage` in a fixed full-viewport wrapper plus the center shade
- [x] 4.2 Build the top bar: "← Menu" ghost sticker button, "Scouted … · from cache" tag, teal "Re-scout" sticker button only when ready
- [x] 4.3 Lay out the ready state as a two-column grid from `md` (350px card, fluid panels) and a single column below, card first
- [x] 4.4 Build the panels with `stickerPanelSx`: Ratings (chips colored by `cardTier`, joined date in the header), Recent form (W/D/L bar, loss-ending and win-ending bars with resignation in orange), Signature moves (openings table), Stockfish's take (name plate plus `speechBubbleSx('left')` bubbles for roasts after the first, hidden with one roast) (`ENGINE_NAME` moved from `GameScreen` to `src/services/engine.ts` for the plate; `TIME_CLASS_LABELS` moved to `src/utils/timeClass.ts`)
- [x] 4.5 For an empty account, replace the recent-form and openings panels with one panel holding the existing no-recent-games message
- [x] 4.6 Track whether this scout passed through `loading` and pass `reveal="flip"` or `"instant"` to `PlayerCard`; fade the loading view out before the card mounts (derived from the ready state's `fromCache`: a fresh result always came through `loading`)
- [x] 4.7 Restyle the error states: dashed empty card slot, "No card for <username>" or "Scouting failed" in the poster style, the existing explanation or message, sticker "Back to menu" and (for network errors) gold "Retry" buttons
- [x] 4.8 Remove the `Paper`, `Chip`, `CircularProgress`, `LinearProgress`, gradient box and `StatRow`/`Section` helpers that are no longer used

## 5. Verification

- [x] 5.1 Run `/axl:verify`
- [x] 5.2 Scout an uncached username at 1280px wide: a face-down gold card bobs, the profile and ratings steps tick off, the games step counts archives and games with a filling striped bar, then the card flips to its front in the left column with panels on the right
- [x] 5.3 On the card for a sub-1000 player: Common color, a Pawn in the art, "Common · Spirit piece: Pawn" ribbon, rating badge with the main time control, type line, six stats with dashes where data is missing, the first roast as flavor text, and a streak sticker if the streak is 3+
- [x] 5.4 Scout a 1400+ player (for example a titled player): the card switches to the matching tier color and piece
- [x] 5.5 Leave and scout the same username again: the report appears face up immediately with no printing sequence or flip; press Re-scout and the sequence and flip run
- [x] 5.6 Scroll a long report: the collage behind it stays fixed and keeps its scale
- [x] 5.7 Check Stockfish's take: roasts after the first appear as paper bubbles beside a "Stockfish" plate; a dossier with one roast shows no such panel
- [x] 5.8 Scout a nonexistent username: an empty dashed card slot with "No card for <username>" and a working "Back to menu"; go offline and scout an uncached name: "Scouting failed" with Retry re-running the sequence
- [x] 5.9 Resize to 400px wide: card first, panels below, no horizontal scroll, a long username wraps inside the card
- [x] 5.10 Turn on reduced motion in the OS and scout an uncached name: no bob, static stripes, and the card appears face up without flipping
- [x] 5.11 With a screen reader or the accessibility tree, the main heading reads "Scouting report" plus the username
- [x] 5.12 Open the main menu and a game: the collages there look unchanged
