---
paths:
  - "src/**"
---

# Code style

- Components are `const` arrow functions with `export default` at the bottom of the file.
- Each component lives in `src/components/ComponentName/` with `ComponentName.tsx`, `ComponentName.types.ts` (props interfaces), and an `index.ts` re-export (`export { default } from './ComponentName'`).
- Shared domain types go in `src/types/*.types.ts` (`chess`, `dossier`, `trashTalk`); reuse `chess.js` types (`Color`, `Square`, `PieceSymbol`, `Move`) rather than redefining them.
- Import across directories via the `@/` alias; `./` only for a component's own files.
