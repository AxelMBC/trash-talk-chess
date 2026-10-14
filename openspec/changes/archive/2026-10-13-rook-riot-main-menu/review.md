# Review: rook-riot-main-menu

Snapshot: 94d0bd48f41795496788620139096d908bd8fa6d

1. [defect] src/components/MainMenu/MainMenu.tsx:103 — spec scenario "Clicks pass through" says no control loses or gains focus, but a click on the collage lands on the root `Box` and the browser moves focus to `<body>`; with the difficulty row open, the focused level button loses focus and Escape (handled on the row's `Stack`) stops working until the player tabs back in · fixed (scenario reworded to "no control is activated")
   Fix: reword the scenario to "nothing is activated" (what `pointer-events: none` guarantees), or add `onMouseDown` on the root `Box` that calls `event.preventDefault()` when `event.target === event.currentTarget`
