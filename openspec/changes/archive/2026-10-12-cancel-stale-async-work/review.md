# Review: cancel-stale-async-work

Snapshot: ed4a2e39659b4b30ee478412865008e4b2f2724f

1. [defect] src/hooks/useScoutingReport.ts:27 — the scout is aborted only on hook unmount, ~300 ms after leaving (App's `AnimatePresence mode="wait"` keeps `ScoutingReport` mounted through the 0.3 s exit); a fetch finishing during the fade still runs `saveDossier` / `rememberScoutedPlayer`, so leaving and going straight into a vs-computer game targets the abandoned player · fixed
   Fix: abort on leave, not on unmount — expose `cancel()` from `useScoutingReport` and call it from both exit buttons in `ScoutingReport.tsx` before `onExitToMenu`, or abort when `useIsPresent()` from `motion/react` turns false; keep the unmount cleanup as a backstop.
