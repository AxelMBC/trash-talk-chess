# Design: table-turn-animation

## Context

`GameScreen.tsx` currently animates turn changes with a `rotateY` card flip: wait `FLIP_DELAY_MS` (420ms) → rotate to 90° (board edge-on, invisible) → swap `orientation` state while hidden → rotate from −90° back to 0. The piece layer in `ChessBoard.tsx` is keyed by `orientation`, so pieces snap (not glide) to mirrored coordinates at the swap; the flip exists to hide that snap. The hiding is imperfect — the board vanishes for a beat and reappears rearranged.

The replacement exploits a geometric fact about the board model in `src/utils/board.ts`: the orientation swap maps every visual position `(col, row)` to `(7−col, 7−row)`, which is exactly a 180° rotation about the board center, and `isDarkSquare` parity is invariant under that map. Therefore **a board rotated 180° in-plane is pixel-identical to the orientation-swapped board at 0°**. The existing snap mechanism can be kept and becomes invisible, because it fires between two identical frames.

Constraints: React 19 + `motion`, stable piece IDs (must not break capture/move animations), `useReducedMotion` support, no new dependencies.

## Goals / Non-Goals

**Goals:**
- One continuous turn-change motion with zero visible realignment.
- Pieces read as upright physical objects riding a turning table.
- Keep the `key={orientation}` snap architecture and `useChessGame` untouched.
- 60fps: rotation driven by MotionValues (no per-frame React renders).

**Non-Goals:**
- Changing move/capture animations, promotion flow, or game-over overlay.
- A user setting to disable auto-rotation (possible follow-up).
- Online/AI play (local two-player only, per current app scope).

## Decisions

### D1: In-plane `rotate` (Z-axis), not `rotateY`
A Z-rotation of 180° lands on a state identical to the orientation swap (symmetry argument above), so no hidden fix-up step is needed. Alternatives considered: keep card flip (rejected — inherently needs a hidden swap), staggered per-piece glide to mirrored squares (rejected — 32 crossing pieces risk visual chaos, higher effort), per-square ripple flips (rejected — weaker metaphor, touches more components).

### D2: Shared MotionValue for rotation; per-piece counter-rotation via `useTransform`
`GameScreen` owns `const boardRotation = useMotionValue(0)` and animates it with `animate(boardRotation, 180, …)`. It is passed down (prop on `ChessBoard` → `ChessPiece`). The board wrapper binds `rotate: boardRotation`. Each `ChessPiece` binds an inner wrapper (around the `<img>`, NOT the outer positioned div) to `useTransform(boardRotation, (v) => -v)`.

- Inner element, because the outer div's transform is the x/y percentage position animated by the `animate` prop; mixing a live MotionValue rotation into it conflicts with the spring. The inner counter-rotation is about the piece's own center, which is exactly the desired "glyph stays upright" behavior.
- MotionValues bypass React rendering, so 32 subscribed pieces update on the compositor path.
- Alternative considered: React context for the rotation value — rejected as unnecessary; the codebase convention is props-only.

### D3: Atomic end-of-spin handoff
When the rotation animation resolves at 180°: call `boardRotation.jump(0)` **first**, then `flushSync(() => setOrientation(turn))`, in the same task. Because rotated-180° and swapped-at-0° are pixel-identical, this frame shows no change.

Order matters (found during verification): the piece layer remounts on the orientation swap, and each remounted glyph initializes its counter-rotation from the MotionValue's *current* value at render time — its live subscription only attaches afterwards. Resetting after the swap left fresh glyphs reading the stale 180° (rendered at −180°, i.e. upside down) until their subscription caught up, which painted as a one-frame flick. Jumping to 0 before the swap means everything that remounts reads the final value at mount; the only element that relies on subscription timing is the long-lived orbit wrapper, whose style write lands on the pre-paint animation frame.

### D4: Choreography (three overlapping beats, ~700ms total, values are starting points)
1. **Lift** (0–150ms): scale 1 → 0.94, optional `rotateX` 0 → 8° on a perspective wrapper.
2. **Orbit** (starts ~80ms in, ~500ms): `boardRotation` 0 → 180 with an ease that starts gently (overlaps the tail of the moved piece's glide) and decelerates into 180.
3. **Settle** (last ~200ms): scale and tilt spring back to rest with slight overshoot.

Replace the hard `FLIP_DELAY_MS = 420` wait with a short overlap (~200ms delay before the orbit's gentle start), so glide + turn read as one gesture. `isFlipping` (rename to `isTurning`) still gates input for the full sequence.

### D5: Transform/wrapper layering
```
Box (perspective: 1400px)
└─ motion.div  A: lift — scale + rotateX + boxShadow (does NOT rotate)
   └─ motion.div B: orbit — rotate: boardRotation
      └─ ChessBoard (borderRadius + overflow hidden — 180°-symmetric, safe to rotate)
```
The board's `boxShadow` moves from `ChessBoard`'s root to wrapper A so the shadow's downward light direction never swings; it still scales with the lift. Uniform `borderRadius` is invariant under 180°, so it stays on the rotating board.

### D6: Label fade
`ChessBoard` gets a `labelsHidden: boolean` prop (true while turning); `BoardSquare` transitions label opacity over ~120ms. Labels are the only genuinely asymmetric element; fading them out before 90° and in after the swap hides their text change.

### D7: Reduced motion & lifecycle
- `useReducedMotion` → skip all beats, `setOrientation(turn)` immediately (current behavior preserved).
- Effect cleanup and `handleRematch` stop any running `animate()` controls, `jump` rotation/scale to rest, reset orientation — same pattern as today's `cancelled` flag.

## Risks / Trade-offs

- [One-frame flash at the handoff if state swap and rotation reset straddle a paint] → `flushSync` + `MotionValue.jump`; manual frame-step verification in the browser; fallback to `useLayoutEffect` ordering per D3.
- [Rotation reads *too* quiet because nothing appears to change shape] → lift/tilt/settle framing (D4) gives the motion weight; tunable knobs isolated as constants at the top of `GameScreen`.
- [Piece drop-shadows (`drop-shadow` on the img) rotate with positions, subtly swinging light direction on glyphs] → shadow is small and blurred; accept, or move drop-shadow inside the counter-rotated wrapper (then it stays fixed) — the latter is free since the counter-rotated wrapper wraps the img anyway.
- [Mid-transition prop churn: a re-render during the spin (e.g. status bar update) re-renders pieces] → MotionValue subscription is render-independent; positions don't change mid-spin because input is locked.
- [`AnimatePresence` exit animations (captures) overlapping the spin start] → capture shrink-out rides the rotating layer; visually fine (object fades while table turns), no special handling.

## Open Questions

- Exact easing/duration values (D4 gives starting points; tune by eye during implementation).
- Whether the `rotateX` tilt survives taste-testing or the lift stays scale-only.
