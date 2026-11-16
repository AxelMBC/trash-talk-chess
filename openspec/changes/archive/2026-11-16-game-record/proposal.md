## Why

The game forgets everything but the last move: `ChessGameState` carries only `lastMove`, the move history sits unseen inside chess.js, and a single click on "New game" or "← Menu" destroys a game in progress. Players cannot read the moves, look back at a position or fix a misclick, and every later feature that needs the game's story (post-game review, persistence, LLM trash talk) has nothing to build on.

## What Changes

- `useChessGame` keeps the ordered list of moves played as first-class state, alongside the live position.
- A move list shows the game in standard notation, numbered by full move, and follows the newest move.
- The player can view any earlier position (click a move, step controls, arrow keys). The board shows the viewed position with pieces gliding between positions; the live game is untouched and input is off until the view returns to the live position.
- vs the computer, a "Takeback" control undoes the human's last move together with the engine's reply.
- "New game" and "← Menu" ask for confirmation when they would discard a game in progress.
- Trash talk stays consistent after a takeback: the line on screen clears and the next move is judged against the restored position.

## Capabilities

### New Capabilities

- `game-record`: the move record, viewing earlier positions, takeback against the computer, and confirmation before discarding a game in progress.

### Modified Capabilities

- `game-screen`: adds the move list panel and the Takeback control (new requirement; existing requirements stay true).
- `live-trash-talk`: adds how a takeback affects the line on screen, the quality baseline and session stats (new requirement; existing requirements stay true).

## Out of Scope

- Post-game review with per-move verdicts (the next change; this one only records the moves).
- Persisting a game across a page refresh.
- Takeback in local pass-and-play (it would have to turn the table back; `turn-transition` is not touched).
- A trash-talk line reacting to the takeback itself.
- Drag-and-drop, sound, choosing a color.

## Impact

- `src/hooks/useChessGame.ts`: `moves`, the view cursor and its derived position, `takeback`, view navigation.
- `src/types/chess.types.ts`: view types.
- `src/components/GameScreen/GameScreen.tsx`: feeds the board from the viewed position, hosts the move list, Takeback and the discard confirmation.
- New `src/components/MoveList/` and `src/components/ConfirmDialog/` (or an extension of the existing sticker dialog panel if one fits).
- `src/hooks/useTrashTalk.ts`: baseline restore on takeback.
- `useEngineOpponent` and `useTableTurn` keep reading the live game and need no change. No new dependencies.
