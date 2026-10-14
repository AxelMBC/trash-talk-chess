## Why

The main menu now has a loud sticker look, but the game screen still uses the old generated style: a soft gold glow, a frosted-glass status bar, grey "White"/"Black" captions, a blurred board shadow, gradient-filled game-over text and a robot emoji in the trash-talk bubble. The game should feel like the same app as the menu while staying calm enough to play on.

## What Changes

- Behind the board, show the menu's rook collage in a quiet tone-on-tone dark palette, so it reads as texture and never competes with the board's pieces or highlights.
- Replace the status bar with a top bar: a small "← Menu" sticker button, a sticker turn label in the display face, and the move number. The label is light for White to move and dark for Black to move. It says "White to move" / "Black to move" in local games, and "Your move" / "Stockfish's move" vs the computer. "Check!" appears as a small red sticker on the label.
- Replace the grey captions above and below the board with player name plates that keep the captured pieces and material advantage. Local games show "White" and "Black". Vs the computer, the engine's plate reads "Stockfish · <difficulty>" and shows its warming-up or thinking state, replacing the pulsing chip, and the human's plate reads "You".
- Frame the board with an ink border and a hard offset shadow that stays pointed the same way while the board turns. Square colors and highlights are unchanged.
- Restyle the trash-talk bubble as the menu's paper speech bubble, with no emoji and no italics, pointing at the engine's plate.
- Move "New game" to a sticker button below the board.
- Restyle the promotion dialog, the game-over overlay and the engine error overlay in the sticker language: display-face titles with no gradient fill, no glows, sticker buttons, and confetti in the collage colors.
- Move the menu's sticker styles (hard shadow, sticker button, focus outline, speech bubble) into a shared module, now that the game screen uses them too, and move the difficulty labels to a shared place for the engine's plate.

## Capabilities

### New Capabilities

- `game-screen`: how the game screen looks: the quiet collage background, the turn label, player name plates, the board frame, and the sticker style of its controls, dialogs and overlays.

### Modified Capabilities

- none. The `ai-opponent` thinking indicator ("a visible thinking state for the engine's side"), the `live-trash-talk` speech-bubble behaviour and the `turn-transition` lift and rotation all stay true as written.

## Out of Scope

- The scouting report screen (a separate change).
- Changing board square colors, highlight colors, piece art or any game behaviour.
- Mode-aware game-over copy (e.g. "You win" vs the computer). The result text stays as it is.
- Changing the MUI theme's global component defaults.

## Impact

- New `src/theme/sticker.ts`: shared sticker styles; `src/components/MainMenu/MainMenu.tsx` switches to it.
- `src/theme/theme.ts`: exports the sticker palette, now used by the collage and the confetti.
- New `src/utils/difficulty.ts`: difficulty labels shared by the menu and the engine's plate.
- `src/components/RookCollage/`: gains a quiet tone.
- `src/components/GameScreen/GameScreen.tsx`: new layout, board frame and shadow.
- `src/components/GameStatusBar/`: becomes the top bar with the turn label (props change).
- `src/components/CapturedPieces/`: becomes the player name plate (props change).
- `src/components/ChessBoard/ChessBoard.tsx`: ink border and smaller radius.
- `src/components/TrashTalkBubble/`, `PromotionDialog/`, `GameOverOverlay/`, `EngineErrorOverlay/`: restyled.
- No new dependencies.
