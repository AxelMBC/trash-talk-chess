# Review: rook-riot-game-screens

Snapshot: bc8b1c846a47cfaa53fc9107f42e740782eef39c

1. [defect] src/components/CapturedPieces/CapturedPieces.tsx:37-90 — nothing on the name plate can shrink, wrap or clip (nowrap name and activity, fixed 22px captures, no `minWidth: 0`/overflow); at ~400px vs the computer, "Stockfish · Medium" + ~8 captures + "+N" + "Thinking…" overflows the column, and GameScreen's `overflow: hidden` clips the far end where the spec-required thinking state sits (estimate, not measured) · fixed
   Fix: give the captures Box `minWidth: 0, overflow: 'hidden'` (or `flexWrap: 'wrap'`) and/or let the name truncate with ellipsis; keep the activity text `flexShrink: 0`.
2. [duplicate] src/components/PromotionDialog/PromotionDialog.tsx:24-27, src/components/EngineErrorOverlay/EngineErrorOverlay.tsx:32-35, src/components/MainMenu/MainMenu.tsx:164-167 — the opaque sticker slab (`background.paper`, 3px ink border, `STICKER_RADIUS`, `hardShadow(8)`) is written out three times instead of living in sticker.ts · fixed
   Fix: add `stickerPanelSx` to src/theme/sticker.ts and spread it in all three.
3. [duplicate] src/components/GameScreen/GameScreen.tsx:89-101, src/components/MainMenu/MainMenu.tsx:78-91 — collage + radial shade layer built twice, differing only in gradient stops · fixed
   Fix: render the shade inside `RookCollage` with per-tone stops in `TONES`; both screens render only `<RookCollage tone=… />`.
4. [duplicate] src/components/GameOverOverlay/GameOverOverlay.tsx:118-123, 137-147 — repeats the menu's outlined poster text (MainMenu.tsx:117-120) and its "CHESS" label sticker (MainMenu.tsx:139-145) · fixed
   Fix: add `posterTextSx` and `labelStickerSx(background)` to src/theme/sticker.ts and use them in both places.
5. [duplicate] src/theme/sticker.ts:18 — `BUBBLE_TAILS.left` is never used, while MainMenu.tsx:43-50 builds the same left tail at `md` by hand with a hard-coded 7px · fixed
   Fix: drop `'left'` from `SpeechBubbleTail`/`BUBBLE_TAILS`, or let `speechBubbleSx` take a responsive tail (`{ xs: 'up', md: 'left' }`) and drop the hand-built `md` overrides, keeping only the menu's `right: 28`.
6. [rule] src/theme/theme.ts:83 — `STICKER_PALETTE.ink` (`#1b1f2a`, a navy fill) clashes with `STICKER_COLORS.ink` (`#000`, borders and shadows); one name per concept · open
   Fix: rename the palette entry (e.g. `navy`) and update the destructure at GameOverOverlay.tsx:13.
7. [defect] src/components/CapturedPieces/CapturedPieces.tsx:64 — the new `overflow: hidden` on the 22px captures row clips each capture's pop-in: the spring overshoots scale to ~1.13 (~25px) for ~100ms, cutting ~1.5px off top, bottom and the first piece's left edge on every capture, even with room to spare (cosmetic) · fixed
   Fix: give the row inner padding cancelled by a negative margin (e.g. `p: '3px', m: '-3px'`) so the overshoot fits inside the clip box, or clip horizontally only (`overflowX: 'clip', overflowY: 'visible'`) with ~3px left padding.
