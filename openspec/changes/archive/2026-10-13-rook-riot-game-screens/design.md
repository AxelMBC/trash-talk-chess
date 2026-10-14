## Context

The main menu (`main-menu` spec, archived change `2026-10-13-rook-riot-main-menu`) introduced the sticker language: `RookCollage`, `STICKER_COLORS` and `DISPLAY_FONT_FAMILY` in `src/theme/theme.ts`, and menu-local style helpers in `MainMenu.tsx:23-88` (`hardShadow`, `focusOutlineSx`, `stickerButtonSx`, `tauntBubbleSx`). The approved direction for the game screen is the "Local" and "vs Computer" panels of the mockup at https://claude.ai/artifact/H5yj4so1G8r63Zo7Uo8qBN.

The game screen today (`GameScreen.tsx`): a glow background (`:67-68`), `GameStatusBar` as a frosted bar with a pulsing engine chip, `CapturedPieces` rows with grey captions above and below the board, a lift layer with a soft 60px box shadow (`:99-105`) wrapping an orbit layer that rotates the board in-plane (`:108`), and grey text buttons at the bottom (`:127-134`). The board is the brightest element on screen and has to stay that way: the user asked for the game screens to be "a little bit cleaner … easy on the eye".

## Goals / Non-Goals

**Goals:** the game screen reads as the same app as the menu, the board stays the focus, and table-turn and piece animations stay as smooth as today.

**Non-Goals:** the scouting report, any change to board colors, piece art, game rules or the turn-transition motion itself, and mode-aware game-over copy.

## Decisions

### 1. Shared sticker module before anything else

`MainMenu.tsx:28-88`'s helpers gain consumers in the game screen, its plates, the bubble, the promotion dialog and both overlays. Following the rule that code moves to a shared place once a second consumer appears, they move to `src/theme/sticker.ts`:

- `STICKER_RADIUS`
- `hardShadow(offset)`
- `focusOutlineSx`
- `stickerButtonSx(background, { size })`: a small size for the game screen's buttons
- `speechBubbleSx(tail)`: tail `'left' | 'up'`, or `{ xs, md }` for the menu's bubble, whose responsive placement stays in `MainMenu`
- `stickerPanelSx`: the opaque slab shared by the menu panel, the promotion dialog and the engine error overlay
- `posterTextSx` and `labelStickerSx(background, shadowOffset)`: the menu title's outlined poster type and gold label, reused by the game-over overlay

`MainMenu` switches to the shared helpers with no visual change. The collage palette also moves to `theme.ts` as `STICKER_PALETTE`, defined after `createTheme` so it can read `theme.palette`, because the game-over confetti uses it as well. The difficulty labels move from `MainMenu.tsx:15-19` to `src/utils/difficulty.ts` (`DIFFICULTY_LABELS: Record<Difficulty, string>`), because the engine's plate needs them too.

### 2. Quiet collage is a tone of `RookCollage`, not a second component

`RookCollage` takes `tone: 'loud' | 'quiet'`, defaulting to `'loud'`. The tone selects the fill palette, die-cut edge, outline and shadow colors. The layout, seed and backdrop are shared, so the game screen shows the same arrangement as the menu in dark browns (fills near `#241c15`–`#30261d`, edge `#3a2f25`, outline `#120e0b`, shadow `#0d0a08`). Each tone's colors are a constant inside `RookCollage`, their only consumer.

The full-color collage was rejected for the game: its gold and lime are almost the board's selected and last-move highlights (`BOARD_COLORS.selected` and `lastMove`, `theme.ts:7-8`), and the stickers are the same rook drawing as the board's rooks. A plain solid background was also considered. It's calm, but it loses the visual link to the menu, and the quiet collage costs the same: one static SVG rendered once per mount.

`App.tsx` renders screens under `AnimatePresence mode="wait"`, so the menu's and the game's collages are never mounted together, and the fixed `<symbol>` id stays unique.

The radial shade that darkens the center is part of `RookCollage`, with its stops set per tone; the quiet tone darkens the center further, so the board column sits on the calmest part.

### 3. Board shadow is a `drop-shadow` filter on the lift layer

The lift layer (`GameScreen.tsx:99-105`) never rotates; the orbit layer inside it does. A hard `box-shadow` on the lift layer would stay an upright square while the board passes through 45°. Today's 60px blur hides that, but an unblurred shadow would not.

`filter: drop-shadow(8px 8px 0 ink)` on the lift layer is computed from the alpha of what the layer draws, so it follows the rotated board's outline. Its offset is in the lift layer's own space, so the shadow always falls down and to the right while the board orbits. The lift layer's `boxShadow` and its 1px ring are removed, and its `borderRadius` follows the board's new `STICKER_RADIUS`, which replaces `BOARD_RADIUS_PX = 28`.

Alternatives:
- **Hard shadow on the orbit layer:** the shadow would rotate with the board and swing around it during the turn, so the light would appear to move.
- **Fade the hard shadow out during the turn:** a lifted board losing its shadow looks wrong, and it adds animation state.

The ink border goes on `ChessBoard`'s root box (`ChessBoard.tsx:307-315`) together with the smaller radius. The border sits inside the box, so the squares lose 6px of width in total and the layout stays put.

### 4. `GameStatusBar` becomes the top bar; `CapturedPieces` becomes the plate

Both components are restyled in place and keep their folders, so no parallel components appear:

- **`GameStatusBar`:** a three-column grid holding the "← Menu" button (`onExitToMenu` moves into its props), the turn label and the move number.
  - The label surface follows `turn` (paper for White, dark ink with a paper border for Black).
  - Its text comes from a new `perspective` prop. `{ mode: 'local' }` gives the color names. `{ mode: 'computer', playerColor }` gives "Your move" or "Stockfish's move".
  - The `engineActivity` prop and the pulsing chip are removed from the bar.
  - On a turn change the label slaps in (short scale and rotate spring); under reduced motion it swaps instantly.
  - "Check!" is a small red sticker anchored to the label's corner.
- **`CapturedPieces`:** keeps its capture and advantage logic (`CapturedPieces.tsx:377-421`) and gains a `name` string and an optional `activity: 'loading' | 'thinking' | null`.
  - It shows the name plate first, then the captures and advantage.
  - The activity text ("Warming up…" / "Thinking…") sits at the plate's far end and keeps today's gentle opacity pulse. Under reduced motion it is static.
  - `GameScreen` computes the names: "White"/"Black" locally, `Stockfish · ${DIFFICULTY_LABELS[difficulty]}` and "You" vs the computer.
- The engine name "Stockfish" is a constant in `GameScreen.tsx`. It already appears in user-facing copy only through this screen.

This keeps the `ai-opponent` requirement "a visible thinking state for the engine's side" true, and more literally than the chip in the shared status bar did.

### 5. Trash-talk bubble restyle only

`TrashTalkBubble` keeps its fixed 56px slot, `aria-live`, `pointer-events: none`, motion and reduced-motion handling. Only the inner bubble's look changes, to `speechBubbleSx('up')`: paper fill, ink border, hard shadow, upright text, no 🤖 prefix. The tail points up at the engine's plate. The `data-testid` stays.

### 6. Overlays and dialog

- **`GameOverOverlay`:**
  - The per-letter title keeps its entrance motion and switches to the display face in paper with an ink stroke and hard shadow, with no `background-clip: text` gradient (`:114-119`).
  - The king's glow `drop-shadow` (`:92`) becomes a hard ink shadow.
  - The subtitle becomes a gold label sticker.
  - Rematch and Main Menu become sticker buttons.
  - Both confetti color lists are replaced by `STICKER_PALETTE` without its ink entry, which would vanish against the dark scrim.
- **`PromotionDialog`:** the frosted, blurred paper becomes an opaque slab with an ink border and hard shadow. Each choice is a paper sticker tile that presses in, with a focus outline on its `ButtonBase`.
- **`EngineErrorOverlay`:** same slab, display-face title, sticker "Back to menu" button.

### 7. Layout

The column width formula `min(94vw, 66dvh, 620px)` (`GameScreen.tsx:73`) stays. From top to bottom:
1. Top bar
2. Opponent's plate
3. Bubble slot (vs computer only)
4. Board
5. Own plate
6. "New game" button

That is the same vertical budget as today: the status bar becomes the top bar, the captions become plates, and the bottom button row loses "← Menu".

## Risks / Trade-offs

- **The filter could make animations stutter.** `drop-shadow` on the lift layer applies to the board's whole subtree, so every piece glide and table turn draws through the filter. Chrome and Firefox apply `drop-shadow` on the GPU for composited layers, so no main-thread repaint is expected. → Verify with DevTools paint flashing and the Performance panel during a turn. If frames drop, fall back to the lift layer's `box-shadow` at rest, fading it to a soft shadow while `isTurning`.
- **A dark Black-to-move label on a dark background could disappear** → the dark label carries a paper border and an ink hard shadow, like the menu's dark rooks carry a paper edge.
- **Prop changes to `GameStatusBar` and `CapturedPieces` break their only call site** → both are used only by `GameScreen`, updated in the same task group.
- **The `turn-transition` spec requires the board to stay "fully visible" and the final frame to match the post-swap render** → the border and shadow are part of the board's own layers and rotate or stay consistently, so the swap frame is unchanged. Covered by a manual check.

## Open Questions

- none
