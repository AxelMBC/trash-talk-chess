# Review: rook-riot-scouting-report

Snapshot: af4dbd0406141d850b7da6983253bcb6a6386eac

1. [defect] src/components/ScoutingReport/ScoutingReport.tsx:497 — Retry calls the cache-first `scout(state.username)`; after a failed Re-scout the stale cached dossier loads instantly with no fetch and no printing sequence, against the "Network failure" scenario ("Retry runs the printing sequence again") · fixed
   Fix: `onRetry={rescout}` (bypasses the cache, reuses the last username; identical for a first scout that failed, which has no cache).
2. [defect] src/components/ScoutingReport/ScoutingReport.tsx:446 — the `position: fixed` collage sits inside App's `motion.div key="scouting"`, which animates `scale` 0.97 → 1; while transformed, `fixed` resolves against that page-tall div, so the `slice` collage scales with the page height and jumps to viewport size when the transform clears, against "Collage stays put" · fixed
   Fix: make the scouting screen's App transition opacity-only (as its exit already is), or mount the fixed collage outside the transformed wrapper (e.g. a portal).
3. [rule] src/components/ScoutingReport/ScoutingReport.tsx:9-10,29 · src/components/ScoutingProgress/ScoutingProgress.tsx:6 — other component folders deep-import PlayerCard internals (`cardFace`, `cardFacts`, `PlayerCard.types`); `TIME_CLASS_LABELS` is a dossier-wide label map living in card internals; `PlayerCard.types.ts` holds non-props types (`CardTier`, `CardBadge`, `CardStat`) and `ScoutingProgress.types.ts` exports non-props `StepStatus` · fixed
   Fix: move `TIME_CLASS_LABELS`, `cardTier`/`CARD_TIERS` and the card face constants to a shared module (e.g. `src/utils/dossier.ts` or `src/theme/card.ts`); move `CardTier`/`CardBadge`/`CardStat` to `src/types/dossier.types.ts` or keep them local to `cardFacts.ts`; keep `StepStatus` local to `ScoutingProgress.tsx`.
4. [rule] src/components/PlayerCard/index.ts:2 · src/components/PlayerCard/CardBack.tsx — `CardBack` is a standalone component consumed by another folder but has no folder of its own and is re-exported as a second named export, against code-style's one-folder-per-component rule · fixed
   Fix: move it to `src/components/CardBack/` (`CardBack.tsx`, `index.ts`) and import it from `@/components/CardBack` in PlayerCard and ScoutingProgress.
5. [duplicate] src/components/ScoutingReport/ScoutingReport.tsx:62 · src/components/ScoutingProgress/ScoutingProgress.tsx:58-60 — the same small poster-text override (`...posterTextSx`, 2px stroke, `hardShadow(4)`) is written twice · fixed
   Fix: export a small variant from `src/theme/sticker.ts` (a size option on `posterTextSx` or a `smallPosterTextSx`) and use it in both.
