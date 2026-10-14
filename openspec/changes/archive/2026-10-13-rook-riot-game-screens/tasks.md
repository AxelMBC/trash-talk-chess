# Restyle the game screens with a quiet rook collage, sticker turn label, player plates and a hard-shadow board

## 1. Shared sticker styles

- [x] 1.1 Create `src/theme/sticker.ts` with `STICKER_RADIUS`, `hardShadow`, `focusOutlineSx`, `stickerButtonSx(background, { size })` and `speechBubbleSx(tail)`, moved from `MainMenu.tsx`
- [x] 1.2 Export `STICKER_PALETTE` from `src/theme/theme.ts`, defined after `createTheme` and built from the theme palette, `BOARD_COLORS.lightSquare` and the collage's extra colors
- [x] 1.3 Create `src/utils/difficulty.ts` with `DIFFICULTY_LABELS: Record<Difficulty, string>`
- [x] 1.4 Switch `MainMenu` to the shared helpers, `DIFFICULTY_LABELS` and `STICKER_PALETTE` with no visual change

## 2. Quiet collage

- [x] 2.1 Add a `tone: 'loud' | 'quiet'` prop (default `'loud'`) to `RookCollage`, selecting fill palette, die-cut edge, outline and shadow colors; `'loud'` uses `STICKER_PALETTE`
- [x] 2.2 Define the quiet tone's dark-brown constants in `RookCollage`

## 3. Board frame

- [x] 3.1 Give `ChessBoard`'s root box a 3px ink border and `STICKER_RADIUS`
- [x] 3.2 In `GameScreen`, replace the lift layer's `boxShadow` and ring with `filter: drop-shadow(8px 8px 0 ink)`, set its radius to `STICKER_RADIUS`, and remove `BOARD_RADIUS_PX`

## 4. Top bar and plates

- [x] 4.1 Rework `GameStatusBar` into the top bar: "← Menu" sticker button (`onExitToMenu` prop), turn label in the display face with a paper or dark surface by `turn`, text from a `perspective` prop, red "Check!" sticker on the label, move number; remove `engineActivity` and the chip
- [x] 4.2 Animate the label with a short slap on turn change, swapping instantly under reduced motion
- [x] 4.3 Rework `CapturedPieces` into a name plate: `name` and optional `activity` props, plate sticker, captures, advantage, and "Warming up…" / "Thinking…" at the far end, pulsing only without reduced motion
- [x] 4.4 In `GameScreen`, replace the glow background with `<RookCollage tone="quiet" />` plus a center shade, compute plate names and the engine's activity, pass `perspective` and `onExitToMenu` to the top bar, and replace the bottom row with a single "New game" sticker button

## 5. Bubble, dialog and overlays

- [x] 5.1 Restyle `TrashTalkBubble`'s bubble with `speechBubbleSx('up')`: paper, ink border, hard shadow, upright text, no 🤖 prefix; keep the slot, `aria-live`, pointer passthrough, motion and `data-testid`
- [x] 5.2 Restyle `PromotionDialog` as an opaque sticker slab with paper sticker tiles that press in and show a focus outline
- [x] 5.3 Restyle `GameOverOverlay`: display-face per-letter title in paper with ink stroke and hard shadow (no gradient), hard-shadow king (no glow), gold label subtitle, sticker Rematch and Main Menu buttons, confetti from `STICKER_PALETTE` without ink
- [x] 5.4 Restyle `EngineErrorOverlay` as a sticker slab with a display-face title and a sticker "Back to menu" button

## 6. Verification

- [x] 6.1 Run `/axl:verify`
- [x] 6.2 Start a local game at 1280px wide: dark tone-on-tone rooks fill the background with no glow; the top bar shows "← Menu", a light "WHITE TO MOVE" sticker and "Move 1"; plates read "White" below and "Black" above; the board has an ink border and a sharp shadow down and to the right
- [x] 6.3 Make a move in the local game: during the table turn the shadow follows the rotated board's outline and keeps falling down and to the right, with no upright square behind it and no snap at the end; the label becomes a dark "BLACK TO MOVE" and the plates swap sides with the board
- [x] 6.4 With DevTools paint flashing on, play a move and watch the turn: the background never flashes, and the Performance panel shows no dropped frames during the glide and turn
- [x] 6.5 Give check in a local game: a red "Check!" sticker sticks to the turn label and goes away once the check is answered
- [x] 6.6 Start a vs-computer game at Hard: the top plate reads "Stockfish · Hard" and shows "Warming up…" then "Thinking…" while the engine works; the bottom plate reads "You"; the label reads "Your move" and "Stockfish's move" in turn; a trash-talk line appears in a paper bubble with no emoji, pointing up at the engine's plate, and clicks on squares under it still work
- [x] 6.7 Capture pieces in either mode: they appear on the capturing player's plate with the advantage when ahead
- [x] 6.8 Promote a pawn: the dialog is an opaque sticker panel and the choices press in; Tab shows a focus outline on each
- [x] 6.9 Finish a game by checkmate: the title is poster type with no gradient, the king has a hard shadow and no glow, the subtitle is a gold label, the buttons are stickers, and the confetti uses the collage colors
- [x] 6.10 Resize to 400px wide: no horizontal scroll, the top bar fits on one line, and the background fills edge to edge
- [x] 6.11 Turn on reduced motion in the OS and play a local move: the label changes instantly, the plate activity text doesn't pulse, and the board swaps orientation without animating
- [x] 6.12 Open the main menu: it looks exactly as before this change
