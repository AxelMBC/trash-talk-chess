import type { EngineScore } from '@/services/engine'
import type { PositionAdvantage } from '@/types/trashTalk.types'

/**
 * Turns the swing between consecutive engine search scores into a verdict on
 * the player's last move. Scores are centipawns from the engine's perspective,
 * so a positive delta means the player's move helped the engine.
 *
 * All tuning lives here: the neutral band is deliberately wide because
 * shallow searches (Easy is depth 4) produce noisy evals, and a wrong roast
 * stings more than a missed one.
 */
export type MoveQuality = 'bad' | 'neutral' | 'good'

/** Cp-equivalent ceiling for mate scores, keeping deltas finite and huge. */
const MATE_CP = 10_000

/** Swing toward the engine at or past this is a blunder worth roasting. */
export const BAD_DELTA_CP = 90
/** Swing toward the player at or past this earns grudging respect. */
export const GOOD_DELTA_CP = -40

export const scoreToCp = (score: EngineScore): number => {
  if (score.type === 'cp') return score.value
  // Mate in N: nearer mates are more extreme. Sign carries who mates whom.
  return score.value > 0 ? MATE_CP - score.value : -MATE_CP - score.value
}

export const classifyPlayerMove = (deltaCp: number): MoveQuality => {
  if (deltaCp >= BAD_DELTA_CP) return 'bad'
  if (deltaCp <= GOOD_DELTA_CP) return 'good'
  return 'neutral'
}

/** Engine advantage (cp) at which the position counts as a rout. */
export const CRUSHING_CP = 500

/** Renders the engine's latest score as a who's-winning summary. */
export const advantageFromCp = (cp: number): PositionAdvantage => {
  const label =
    cp >= CRUSHING_CP
      ? 'engine crushing'
      : cp >= BAD_DELTA_CP
        ? 'engine ahead'
        : cp <= -CRUSHING_CP
          ? 'player crushing'
          : cp <= GOOD_DELTA_CP
            ? 'player ahead'
            : 'balanced'
  const pawns = Math.abs(cp / 100).toFixed(1)
  const text =
    label === 'balanced'
      ? 'roughly equal'
      : `${cp > 0 ? 'engine' : 'player'} up ${pawns} pawns`
  return { cp, label, text }
}
