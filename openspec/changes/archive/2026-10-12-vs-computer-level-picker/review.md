# Review: vs-computer-level-picker

Snapshot: 10c51e718a8eb7df568dd50de7b435e3c18c3892

1. [defect] src/components/MainMenu/MainMenu.tsx:171 — Escape is handled by the level group's `onKeyDown`, so it only works while focus is inside the group; after clicking the background or the scout field with the levels shown, Escape does nothing, contrary to the "Back out of level selection" scenario · accepted — spec narrowed to focus-scoped Escape; not worth a document listener
   Fix: while `isPickingLevel`, register a `document` `keydown` listener in a `useEffect` (with cleanup) that calls `setComputerEntry('dismissed')` on Escape, and drop the Stack's `onKeyDown` — or narrow the spec to focus-scoped Escape if that is the intended behaviour.
