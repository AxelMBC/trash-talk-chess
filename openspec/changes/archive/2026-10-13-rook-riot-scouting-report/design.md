## Context

The approved look is the mockup at https://claude.ai/artifact/LAZvX9mekBhc2hfv7fDyxV (ready, loading and not-found states). It replaced an earlier tabloid concept ("The Daily Blunder", third panel of https://claude.ai/artifact/H5yj4so1G8r63Zo7Uo8qBN) because the user's other project, combat-atlas, already uses a newspaper style: Anton over an off-white page (`combat-atlas/src/styles/theme/lightPalette.ts`), Georgia serif and a `#c0392b` red accent (`src/styles/all/_variables.scss`).

Today `ScoutingReport.tsx` renders:
- a glow background (`:165-166`)
- a gradient roast box (`:61-76`)
- MUI `Paper` sections with `StatRow`s (`:39-53`)
- result chips (`:103-114`)
- a `CircularProgress` with an archive-count `LinearProgress` while loading (`:183-202`)
- centered text errors (`:204-227`)

`useScoutingReport` exposes `loading` with `progress: CollectProgress | null`, where `null` covers both the profile fetch and the stats fetch (`useScoutingReport.ts:53-74`).

Shared pieces already exist from the menu and game-screen changes:
- `RookCollage` with `tone`
- `src/theme/sticker.ts`: `stickerPanelSx`, `stickerButtonSx`, `speechBubbleSx`, `labelStickerSx`, `posterTextSx`, `hardShadow`, `focusOutlineSx`
- `STICKER_PALETTE` and `DISPLAY_FONT_FAMILY`
- `PIECE_IMAGES`

## Goals / Non-Goals

**Goals:** a report that looks like its own object (not a newspaper), uses every dossier field, turns loading into a moment, and reuses the existing sticker kit.

**Non-Goals:** avatars, dossier schema changes, roast copy, and trash-talk use of the card tier.

## Decisions

### 1. A player card, not a newspaper

A trading card has a natural slot for each dossier field:
- **Rating badge:** current rating.
- **Tier and art:** derived from rating.
- **Type line:** career facts.
- **Stat box:** recent numbers.
- **Flavor text:** the first roast.
- **Card number:** lifetime games.
- **Streak sticker:** current streak.

Cards and stickers are both collectibles, so the die-cut, hard-shadow language carries over without a new visual vocabulary.

Alternatives:
- **Re-skinning today's cards as sticker panels:** consistent, but nothing on the page is memorable.
- **A wanted poster or rap sheet:** a printed document again, close to the newspaper problem.
- **A fight-night "tale of the tape":** combat sports is combat-atlas's subject.

### 2. Card facts are pure functions next to the card

`src/theme/card.ts` exports `cardTier(rating: number | null)`, which returns `{ name, piece, color }` from a `CARD_TIERS` table with lower bounds 0, 1000, 1400, 1800 and 2200. Colors are `STICKER_PALETTE.cream`, `teal`, `blue`, `pink` and `gold`. Pieces are `p`, `n`, `b`, `r` and `q`. It sits there with the card's face constants (width, aspect ratio, radius, face border and shadow) because the card, the loading view, the error slot and the rating chips all use them.

`src/components/PlayerCard/cardFacts.ts` exports:
- `cardBadge(dossier)` returns the favourite time class's current rating, else the best current rating with its time class, else `null` (shown as a dash and "Unrated").
- `cardStats(dossier)` returns six `{ label, value }` entries with `'—'` where data is missing:

| Label | Value |
|---|---|
| PEAK | highest `best` across ratings, falling back to the highest `current` |
| WIN | `wins / sampleSize` |
| RESIGNS | `lossEndings.resignation / losses` |
| ACCURACY | `accuracy.average` |
| STREAK | `W`, `L` or `D` plus the length |
| WORST RUN | `longestLossStreak` |

They live next to their only consumer. Rating chips in the panels reuse `cardTier` for their color, and `TIME_CLASS_LABELS` moves from `ScoutingReport` to `src/utils/timeClass.ts` since the card and the panels both label time classes.

`bestCurrentRating` moves from `src/data/roasts.ts:14-17` to `src/services/dossier.ts` as an export, because the tier and the roast rules now both need it.

### 3. Component split

`ScoutingReport` (250 lines today) keeps the phase switch, the top bar and the panels. Two new components take the rest:

- **`PlayerCard`:** props `dossier`, `roast` and `reveal: 'flip' | 'instant'`.
  - Renders the front: header with "Scouting report" and the username as the `h1`, badge, art, rarity ribbon, type line, stat box, flavor text and footer.
  - Renders the back, used only by the flip: gold, with a paper rook and "Trash Talk Chess".
  - Renders the streak sticker.
  - Art: a quiet `RookCollage` behind the white spirit piece from `PIECE_IMAGES`, with a paper die-cut edge built from stacked `drop-shadow`s on that small image.
- **`ScoutingProgress`:** props `username`, `stage` and `progress`.
  - Renders the face-down card: the same back, extracted as its own `CardBack` component (`src/components/CardBack/`) that both use.
  - "Printing <username>'s card", the kept "Digging through <username>'s dirty laundry…" line, and the three steps.

A step is done once `stage` has moved past it. The games step's bar is `gamesCollected / target`, empty until the first progress callback.

### 4. Flip on mount, not a shared-element move

The loading view and the ready layout put the card in different places: centered and small, versus a left column. A shared-element transition (`layoutId`) that both moves and flips the card was considered: it is smoother, but much harder to get right with a 3D flip, reduced motion and the cached path.

Instead, when the phase becomes `ready`, `ScoutingReport` passes `reveal="flip"` when it saw `loading` for this scout, and `reveal="instant"` for a cached result. `PlayerCard` mounts face down and springs `rotateY` from 180 to 0, using `motion` with `perspective` on its parent and `backfaceVisibility: hidden` on both faces. The loading view fades out first (`AnimatePresence mode="wait"`). Under `useReducedMotion` the card always mounts face up.

### 5. Loading stage comes from the hook

`ScoutingState`'s loading variant gains `stage: 'profile' | 'ratings' | 'games'`:
- The scout starts at `'profile'`.
- It moves to `'ratings'` before `fetchStats`.
- It moves to `'games'` before `collectRecentGames`.

Progress updates keep the stage. The UI could not tell profile from ratings otherwise, since `progress` is `null` for both. Cancellation and stale-scout guards are unchanged.

### 6. Background and layout

- **Collage:** the loud `RookCollage` sits in a `position: fixed; inset: 0` wrapper, with the menu's center shade. `RookCollage` fills its parent with `xMidYMid slice`, so inside a tall scrolling page it would scale its rooks up with the content height.
- **Layout:** a two-column grid, `350px` card and fluid panels, from `md` up. One column below that, card first.
- **Card:** keeps its `-2deg` tilt and an 8px hard shadow.
- **Panels:** `stickerPanelSx` with display-face headings.
- **Top bar:** "← Menu" ghost sticker button, the "Scouted … · from cache" line on a dark tag, and a teal "Re-scout" sticker button shown only when ready.

### 7. Symbol id per collage instance

`RookCollage` uses a module constant `ROOK_SYMBOL_ID` (`RookCollage.tsx:18`). The card's art renders a second collage while the page's is mounted, which would give two `<symbol>`s the same id. The id becomes `useId()`-based, so every instance references its own symbol. The menu and game screen are unaffected.

### 8. Motion inventory

| Motion | Without reduced motion | With reduced motion |
|---|---|---|
| Face-down card bob | slow infinite tilt and lift, about 2.4s | static |
| Progress stripes | CSS `background-position` loop | static |
| Bar fill | width transition | instant |
| Card reveal | spring flip | appears face up |
| Panels | short stagger on first render | instant |
| Streak sticker | slaps on after the flip | instant |

## Risks / Trade-offs

- **3D flip artifacts** (backface flicker, the tilt fighting the flip) → the tilt goes on the card slot and the flip on an inner element, with `transformStyle: 'preserve-3d'` only on the flipping element. A manual check covers it.
- **Long usernames could overflow the card header** → the username wraps with `overflow-wrap: anywhere`, and the badge doesn't shrink.
- **Tier thresholds are a judgment call** → one table in `src/theme/card.ts`, covered by the spec's boundary scenario.
- **An infinite bob and a stripe loop run during loading** → only for the seconds a fetch takes, stopped by unmount, and off under reduced motion.

## Open Questions

- none
