# Proposal: table-turn-animation

## Why

The current turn-change animation in local play is a `rotateY` card flip that hides the board edge-on at 90° and teleports pieces to their mirrored squares while invisible. The hidden fix-up step reads as junky: the board vanishes for a beat and reappears already rearranged, so the motion before and after the swap never connects. The user wants a turn transition that is as smooth as possible — one continuous motion with no visible realignment moment.

## What Changes

- Replace the `rotateY` card flip in `GameScreen` with a "Table Turn": a single continuous 180° in-plane rotation of the board, exploiting the checkerboard's 180°-rotational symmetry so the rotated board is pixel-identical to the orientation-swapped board — the state swap happens between two identical frames and is invisible.
- Pieces counter-rotate around their own centers during the spin so glyphs stay upright throughout, reading as the player walking around the table rather than the board doing a trick.
- Add lift/settle framing (slight scale-down and 3D tilt at the start, spring settle at the end) so the motion has a beginning and an end.
- Fade file/rank coordinate labels out during the spin and back in on settle (the only element that genuinely snaps under a 180° rotation).
- Keep the board's box shadow on a non-rotating wrapper so the light direction doesn't swing during the spin.
- Overlap the start of the spin with the tail of the moved piece's glide (replacing the current hard 420ms wait) so move + turn read as one gesture.
- Preserve the reduced-motion path: instant orientation swap with no animation.

## Capabilities

### New Capabilities

- `turn-transition`: Behavior of the board orientation change between turns in local play — continuous seamless rotation, upright pieces, input lockout during the transition, label handling, and reduced-motion fallback.

### Modified Capabilities

<!-- none — existing specs (chesscom-data-intake, player-dossier, scouting-report-ui) are unrelated -->

## Impact

- `src/components/GameScreen/GameScreen.tsx` — replaces the flip effect (FLIP_DELAY_MS wait, rotateY half-turn/settle choreography) with the rotation choreography; shadow wrapper restructuring.
- `src/components/ChessBoard/ChessBoard.tsx` — board may need to accept/propagate a rotation motion value for piece counter-rotation; the `key={orientation}` piece-layer snap mechanism is retained (it becomes invisible).
- `src/components/ChessPiece/` — applies per-piece counter-rotation around its own center.
- `src/components/BoardSquare/` — coordinate label fade during transition.
- No dependency changes: uses the already-installed `motion` library (shared MotionValue between board rotation and piece counter-rotation).
- No changes to `useChessGame` game logic or piece-identity tracking.
