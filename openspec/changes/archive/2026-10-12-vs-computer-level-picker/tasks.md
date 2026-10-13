# Reveal vs-computer difficulty levels in place and make the menu's mode buttons equal size

## 1. Main menu

- [x] 1.1 Size the Local and vs Computer buttons equally in `MainMenu.tsx`
- [x] 1.2 Replace the always-visible difficulty toggle with an in-place swap: vs Computer → back + Easy/Medium/Hard, where a level starts the game
- [x] 1.3 Restore the vs Computer button from back or Escape; move focus into the levels on reveal; swap instantly under reduced motion

## 2. Verification

- [x] 2.1 Run `/axl:verify`
- [x] 2.2 In the running app: the menu shows Local and vs Computer at equal size with no levels; clicking vs Computer swaps it for ← Easy Medium Hard without the title or scout row moving; ← or Escape restores it; clicking a level opens the game at that difficulty
