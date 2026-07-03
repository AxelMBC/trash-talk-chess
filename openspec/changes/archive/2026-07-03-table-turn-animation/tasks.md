# Tasks: table-turn-animation

## 1. Rotation plumbing

- [x] 1.1 In `GameScreen`, create the shared `boardRotation` MotionValue and lift/settle values; remove `FLIP_HALF_TURN`/`FLIP_SETTLE`/`useAnimationControls` flip machinery
- [x] 1.2 Restructure the board wrappers per design D5: perspective Box → lift motion.div (scale/rotateX + boxShadow) → orbit motion.div (`rotate: boardRotation`) → `ChessBoard`
- [x] 1.3 Move the boxShadow from `ChessBoard`'s root `Box` to the non-rotating lift wrapper in `GameScreen`
- [x] 1.4 Thread `boardRotation` through `ChessBoard` props to `ChessPiece`; update both `.types.ts` files
- [x] 1.5 In `ChessPiece`, add an inner counter-rotating wrapper around the `<img>` bound to `useTransform(boardRotation, (v) => -v)`, and move the glyph `drop-shadow` onto it

## 2. Choreography

- [x] 2.1 Rewrite the turn-change effect in `GameScreen`: short overlap delay (~200ms), lift beat, orbit `boardRotation` 0→180 with gentle-start/decelerating ease, settle spring (design D4)
- [x] 2.2 Implement the atomic handoff at 180°: `setOrientation(turn)` + `boardRotation.jump(0)` committed in the same paint (design D3)
- [x] 2.3 Rename `isFlipping` → `isTurning` and gate input for the full lift-orbit-settle sequence
- [x] 2.4 Preserve the reduced-motion path (instant orientation swap, no animation)
- [x] 2.5 Handle cancellation and rematch: stop running animations, jump rotation/scale to rest, reset orientation (design D7)

## 3. Label fade

- [x] 3.1 Add `labelsHidden` prop to `ChessBoard`/`BoardSquare` and fade label opacity (~120ms) while turning
- [x] 3.2 Pass `labelsHidden={isTurning}` from `GameScreen` so labels are out before 90° and back in after settle

## 4. Verification & tuning

- [x] 4.1 Run the app; verify a full game's turn changes: no snap/flash at the handoff frame (frame-step in devtools per design D3 risk), glyphs upright throughout, labels never visibly change text
- [x] 4.2 Verify captures, castling, en passant, and promotion animations still play correctly with the rotating layer
- [x] 4.3 Verify game-over (no rotation), rematch reset, and reduced-motion (emulate in devtools) scenarios from the spec
- [x] 4.4 Tune duration/easing/lift constants by eye; run `npm run lint` and `npm run build`
