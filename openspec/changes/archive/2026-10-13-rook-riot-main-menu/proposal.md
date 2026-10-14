## Why

The main menu reads as a generated landing page: soft gold and teal glows, a gradient-filled title, blurred floating pieces, a glowing primary button and Inter set in a centered stack. A trash-talk game should look loud and a little trashy on purpose, and the menu is the first thing a player sees.

## What Changes

- Replace the glow background and the six floating pieces with a static sticker-bomb collage of rooks: one rook shape repeated in a clashing palette, random tilt and size, overlapping, a few knocked over, each with a paper die-cut edge and a hard offset shadow. The collage darkens toward the center.
- Put the mode buttons, scout row and caption on one solid panel with a hard black border and offset shadow. The buttons get the same treatment (black border, hard shadow that presses in on click) instead of the glow.
- Reset the title in a condensed poster face: "TRASH TALK" tilted with a hard shadow, "CHESS" as a gold label slapped on at the opposite angle.
- Drop the tagline line "Talk is cheap. Your moves shouldn't be." The voice moves into a speech bubble attached to the vs Computer entry that reads "Bold of you to show up.", as if the computer opponent is saying it.
- Replace the staggered fade-ups with one entrance: the title slams in, the CHESS label slaps on, the panel lands. Nothing moves under reduced motion.
- Add the `@fontsource/anton` dependency (one weight) for the display face.

## Capabilities

### New Capabilities

- `main-menu`: how the main menu looks and holds together: the rook collage background, control legibility over it, and the computer's taunt on the vs Computer entry.

### Modified Capabilities

- none. The `ai-opponent` and `scouting-report-ui` requirements on the menu's entries (equal-size modes, in-place level swap, username entry) stay true as written.

## Out of Scope

- Restyling the game screen or scouting report. They keep their current glow background for now, so the menu will be the only screen in the new style.
- Rotating or engine-generated taunt lines on the menu. The bubble is one fixed line.
- Changing what the menu does: same entries, same flows, same keyboard behaviour.
- Changing the MUI theme's global button or typography defaults.

## Impact

- `src/components/MainMenu/MainMenu.tsx`, `MainMenu.types.ts`: new layout and styles; `FLOATING_PIECES` and `FloatingPieceConfig` removed.
- New `src/components/RookCollage/` (component, types, index).
- `src/theme/theme.ts`: exports the display font family constant.
- `src/main.tsx`: imports the Anton font.
- `package.json`: adds `@fontsource/anton`.
- Runtime cost goes down: six infinitely looping blurred animations become one static SVG with no filters.
