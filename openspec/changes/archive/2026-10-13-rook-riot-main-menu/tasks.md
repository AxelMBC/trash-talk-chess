# Restyle the main menu with a sticker-bomb rook collage, poster title and computer taunt

## 1. Font and theme

- [x] 1.1 Add `@fontsource/anton` as a dependency and import its 400 weight in `src/main.tsx`
- [x] 1.2 Export `DISPLAY_FONT_FAMILY` (Anton with Impact / Arial Narrow / sans-serif fallback) from `src/theme/theme.ts`

## 2. Rook collage

- [x] 2.1 Create `src/components/RookCollage/` (`RookCollage.tsx`, `RookCollage.types.ts`, `index.ts`) following the component layout rules
- [x] 2.2 Add the rook `<symbol>` with the paths copied from `src/assets/pieces/wR.svg`, fill and stroke removed, and a one-line comment naming the source and why it is copied
- [x] 2.3 Build the sticker list once at module scope: seeded LCG, 12 × 7 jittered grid over a 1600 × 900 viewBox, scale, tilt within ±35°, about 12% knocked over, palette color, shuffled draw order
- [x] 2.4 Define the palette from `theme.palette.primary.main`, `theme.palette.secondary.main` and `BOARD_COLORS.lightSquare`, plus pink, tomato, blue, lime and ink (paper and black ink are shared with the menu, so they live in `STICKER_COLORS` in `theme.ts` next to `BOARD_COLORS`)
- [x] 2.5 Render each sticker as three `<use>`: offset black shadow, paper die-cut edge, colored rook with black outline. No filters, no animation, `aria-hidden`, `pointer-events: none`, `preserveAspectRatio="xMidYMid slice"`, filling its parent

## 3. Main menu

- [x] 3.1 Remove the radial glows, `FLOATING_PIECES` and the `FloatingPieceConfig` type; render `RookCollage` plus a center-darkening shade layer behind the content
- [x] 3.2 Rebuild the title: "TRASH TALK" in the display face, tilted, with a black stroke and hard offset shadow; "CHESS" as a gold label with a black border, tilted the other way
- [x] 3.3 Remove the "Talk is cheap…" tagline
- [x] 3.4 Put the mode slot, the scout row and the caption on one opaque panel with a black border and a hard offset shadow
- [x] 3.5 Restyle the Local, vs Computer and level buttons locally with a black border and a hard shadow that presses in on `:active`, keeping equal heights and a visible keyboard focus outline
- [x] 3.6 Add the "Bold of you to show up." bubble inside the vs Computer slot `Box`, outside the `AnimatePresence`: beside the panel with its tail pointing left on wide screens, hanging below the slot with its tail pointing up on narrow screens, with extra space above the scout row there; `pointer-events: none`
- [x] 3.7 Replace the staggered fade-ups with one entrance (title slam, CHESS label slap, panel drop) that renders in its final state under reduced motion

## 4. Verification

- [ ] 4.1 Run `/axl:verify`
- [ ] 4.2 Open the menu at 1280 px wide: a colored rook collage covers the screen, darker toward the center; the title is tilted poster type with a gold CHESS label; the controls sit on a solid panel; the bubble beside the panel points at vs Computer
- [ ] 4.3 Click vs Computer: the level row replaces it, the bubble stays and nothing else moves; ← and Escape still restore it; a level starts the game
- [ ] 4.4 Resize to 400 px and 768 px wide: no horizontal scroll, the collage fills edge to edge, and the bubble covers no button or input
- [ ] 4.5 Reload twice and leave and return to the menu: the rooks are in the same places every time
- [ ] 4.6 With reduced motion turned on in the OS, open the menu: nothing animates
- [ ] 4.7 Tab through the menu: every control shows a visible focus outline; a screen reader announces the entry as "vs Computer"
