## Context

`MainMenu.tsx` paints two radial glows over `#0b0e14` (`:54-55`), floats six blurred piece images on infinite `motion` loops (`:23-30`, `:59-77`), fills the title with gradients via `background-clip: text` (`:85-112`), gives the Local button a glowing shadow (`:148`) and fades every block up on a stagger (`:79-131`). Inter is the only loaded face (`main.tsx:5-8`). The approved look is mockup B at https://claude.ai/artifact/6e5YoGKfZ2oW7pKnWS8tsP. Its tagline was a free-floating bubble on the panel; this change attaches the bubble to the vs Computer entry instead.

The menu's structure is already specified and must stay true: equal-size Local and vs Computer entries, the in-place level swap inside a fixed-height slot that does not shift the menu (`openspec/specs/ai-opponent/spec.md`), and the username row (`openspec/specs/scouting-report-ui/spec.md`).

## Goals / Non-Goals

**Goals:** a menu that looks loud and hand-made, with the controls as legible as today and less runtime work than today.

**Non-Goals:** restyling the game screen or scouting report, changing MUI theme defaults, changing any menu flow.

## Decisions

### 1. The collage is one static inline SVG

`RookCollage` renders a single `<svg>` with the rook as a `<symbol>` and every sticker drawn as three `<use>` elements: a black copy offset by a few units (the hard shadow), a paper-colored copy with a thick stroke (the die-cut edge), and the colored rook with a black outline. No `filter`, no animation, no state, `aria-hidden`, `pointer-events: none`. It renders once per menu mount.

This beat three alternatives:
- **CSS `mask-image` over `wR.svg`**: reuses the asset file, but the mask keeps only the silhouette, so the rook loses its inner lines and there is no die-cut edge. It also needs one element per rook.
- **A raster collage image**: one more asset, soft when scaled up, and every palette tweak means re-exporting.
- **Keeping animated floats**: the endless motion is part of what reads as generated, and it is the only ongoing cost on the menu today.

A single `feDropShadow` on the group was tried in the mockup. The offset `<use>` gives the same hard shadow without a filter region that repaints the whole viewport on resize.

### 2. The rook path is copied into the component

`<use>` can only reference a symbol in the same document or an external SVG with an id. Vite inlines assets under 4 KB as `data:` URIs (`wR.svg` is 476 bytes), and `<use>` refuses `data:` URIs. So the five paths from `src/assets/pieces/wR.svg` are copied into the `<symbol>` with their `fill`/`stroke` removed so each `<use>` can set them. A one-line comment names the source file.

### 3. Placement is a seeded jittered grid computed once at module scope

A fixed seed drives a small LCG that places one sticker per cell of a 12 × 7 grid over a `1600 × 900` viewBox. Each sticker gets a jitter inside its cell, a scale, a tilt within ±35°, about 12% knocked onto their side (±80–100°), a palette color, and a random draw order. `preserveAspectRatio="xMidYMid slice"` makes it cover any viewport. Wide screens show the whole grid and phones crop to the middle.

The grid keeps coverage even, so there are no bald patches or clumps. The seed keeps every visit identical. If one rook lands badly, change the seed. The alternative was a hand-written array of about 84 entries: more control per sticker, but far more lines for no real gain.

### 4. Palette reuses the app's colors where it has them

Gold and teal come from the theme palette (`primary.main`, `secondary.main`) and cream from `BOARD_COLORS.lightSquare`. Hot pink, tomato red, electric blue, lime and ink are added as a palette constant in `RookCollage`, its only consumer.

### 5. Hard-shadow styling stays inside the menu

The panel, the button borders and the offset shadows that press in on `:active` are `sx` constants in `MainMenu.tsx`. Changing the theme's `MuiButton` overrides would restyle the game screen and scouting report, which is out of scope. Focus stays visible: keep MUI's focus-visible state and add an outline in a color that contrasts with the panel.

### 6. Display face: Anton via `@fontsource/anton`

The title needs a condensed poster face. Inter 900 needs no new dependency, but it stays the safe default that made the page look generated in the first place. Anton ships one weight (400), so the cost is one small woff2 file. `theme.ts` exports `DISPLAY_FONT_FAMILY` with an Impact / Arial Narrow fallback, so the swap from fallback to Anton barely changes the title's width.

### 7. The taunt bubble belongs to the vs Computer slot

The bubble is absolutely positioned inside the fixed-height `Box` that already holds the vs Computer entry and its level-row swap (`MainMenu.tsx:155`). It sits outside the `AnimatePresence`, so it stays put while the entry swaps, and it is a sibling of the button, so the button's accessible name is still "vs Computer". `pointer-events: none` everywhere.

- **Wide screens**: the bubble sits just right of the panel, level with the slot, tilted a few degrees, with its tail pointing left at the entry.
- **Narrow screens** (no room beside the panel): the bubble hangs from the slot's lower right with its tail pointing up, and the scout row gets enough extra top margin that the bubble covers no control.

It uses the menu's sticker language (paper fill, black border, hard shadow) rather than `TrashTalkBubble`. That component is built for the slot above the board: fixed height, `aria-live`, tail pointing up at the opponent. Making it work here would mean changing an in-game component for a menu concern.

### 8. One entrance instead of a stagger

Using `motion`: "TRASH TALK" scales down from about 1.3 with a stiff spring, then the CHESS label rotates in and lands, then the panel drops into place. Under `useReducedMotion` everything renders in its final state with `initial={false}`.

## Risks / Trade-offs

- The busy background could pull attention from the gold Local button → the panel is opaque, the collage darkens toward the center, and the black borders separate the button from any gold rooks.
- The bubble could collide with the panel or the scout row at in-between widths → check at 400, 768 and 1280 px wide, and switch to the narrow placement at the breakpoint where the wide placement no longer fits.
- The title may flash in the fallback face (`font-display: swap`) → the Impact fallback has similar proportions, and it only happens on the first visit.
- The menu won't match the game screen and scouting report until they are restyled → accepted. It is out of scope here.

## Open Questions

- none
