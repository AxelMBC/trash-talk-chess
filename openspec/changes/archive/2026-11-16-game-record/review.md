# Review: game-record

Snapshot: 86aa383797c581787b3333ba0b4382f728333e1a

1. [duplicate] src/components/MoveList/MoveList.tsx:111 — the list's panel style (paper background, 2.5px ink border, `STICKER_RADIUS`, `hardShadow(3)`) repeats the player-plate style at src/components/CapturedPieces/CapturedPieces.tsx:45 · fixed
   Fix: export a `stickerPlateSx` from `src/theme/sticker.ts` next to `stickerPanelSx` and spread it in both components.
2. [duplicate] src/hooks/useChessGame.ts:71 — the private `opposite(color)` helper re-implements a flip written inline at src/components/GameScreen/GameScreen.tsx:42, :73 and src/components/CapturedPieces/CapturedPieces.tsx:30 · fixed
   Fix: move `opposite` to `src/utils/board.ts` beside `colorName`, export it, and use it at the three inline sites.
3. [rule] src/components/MoveList/MoveList.types.ts:4 — the runtime constant `MOVE_LIST_COLUMN_BREAKPOINT` lives in the props-types file and src/components/GameScreen/GameScreen.tsx:17 imports it through the deep path `@/components/MoveList/MoveList.types`, bypassing the component's `index.ts`; the wide-viewport layout decision is split between GameScreen's wrapper and MoveList · fixed
   Fix: move the absolute-positioning wrapper (breakpoint, width, gap) into MoveList so the constant stays private in `MoveList.tsx`, or move the constant to a shared theme/layout module imported by both files.
