# Cancel stale async work on rematch and screen exit

## 1. Fixes

- [x] 1.1 Rematch cancels a table turn in flight (`GameScreen` keeps the turn effect's cancel in a ref and calls it from `handleRematch`)
- [x] 1.2 Leaving the scouting screen aborts the scout: `chesscom` fetches take an `AbortSignal`, `useScoutingReport` drops results once aborted and aborts on unmount
- [x] 1.3 Game-over confetti stops on unmount (`fireCelebration` returns a stop function the effect's cleanup calls)

## 2. Verification

- [x] 2.1 Run `/axl:verify`
- [x] 2.2 Local game: make a Black move, click New game within ~200 ms; the board stays still at White's orientation and accepts clicks
- [x] 2.3 Scout user A, go back to the menu before it loads, scout user B; the Network tab shows A's requests cancelled, and the next vs-computer game's profile lines are about B; also scout A, leave before it loads and start a vs-computer game at once, and no profile lines about A appear
- [x] 2.4 Checkmate, then click Rematch right away; confetti stops when the overlay closes
