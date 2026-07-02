import type { PlayerDossier } from '@/types/dossier.types'

/**
 * Static, threshold-driven roast copy. This module is the placeholder for the
 * future LLM-powered trash-talk engine — the report screen only knows about
 * `pickRoasts`, so swapping the copy source later doesn't touch the UI.
 */
interface RoastRule {
  id: string
  applies: (dossier: PlayerDossier) => boolean
  line: (dossier: PlayerDossier) => string
}

const bestCurrentRating = (dossier: PlayerDossier): number | null => {
  const ratings = Object.values(dossier.career.ratings).map((block) => block.current)
  return ratings.length > 0 ? Math.max(...ratings) : null
}

const lossShare = (dossier: PlayerDossier, ending: 'timeout' | 'resignation'): number =>
  dossier.recent.losses > 0 ? dossier.recent.lossEndings[ending] / dossier.recent.losses : 0

const RULES: RoastRule[] = [
  {
    id: 'no-games',
    applies: (d) => d.recent.sampleSize === 0,
    line: () => 'No games on record. Did you make this account just to lurk, or are you scared of leaving evidence?',
  },
  {
    id: 'veteran-under-1000',
    applies: (d) => {
      const rating = bestCurrentRating(d)
      return d.career.accountAgeYears >= 5 && rating !== null && rating < 1000
    },
    line: (d) =>
      `WOW. ${Math.floor(d.career.accountAgeYears)} years on chess.com and still under 1000. That has to be some kind of record.`,
  },
  {
    id: 'timeout-artist',
    applies: (d) => d.recent.losses >= 5 && lossShare(d, 'timeout') >= 0.25,
    line: (d) =>
      `${Math.round(lossShare(d, 'timeout') * 100)}% of your recent losses were on time. The clock is not a spectator, friend.`,
  },
  {
    id: 'serial-resigner',
    applies: (d) => d.recent.losses >= 5 && lossShare(d, 'resignation') >= 0.5,
    line: () =>
      'You resign more than half the games you lose. At least let them checkmate you — it’s called closure.',
  },
  {
    id: 'one-trick-opening',
    applies: (d) =>
      d.recent.topOpenings.length > 0 &&
      d.recent.topOpenings[0].count >= Math.max(5, d.recent.sampleSize * 0.3),
    line: (d) =>
      `The ${d.recent.topOpenings[0].name} again? ${d.recent.topOpenings[0].count} of your last ${d.recent.sampleSize} games. Innovation is free, you know.`,
  },
  {
    id: 'loss-streak',
    applies: (d) => d.recent.longestLossStreak >= 5,
    line: (d) =>
      `A ${d.recent.longestLossStreak}-game losing streak and you kept queuing up. Brave. Foolish, but brave.`,
  },
  {
    id: 'low-accuracy',
    applies: (d) => d.recent.accuracy !== null && d.recent.accuracy.average < 65,
    line: (d) => `${d.recent.accuracy!.average}% average accuracy. The pieces deserve better than this.`,
  },
  {
    id: 'fallen-idol',
    applies: (d) =>
      Object.values(d.career.ratings).some(
        (block) => block.best !== null && block.current <= block.best - 150,
      ),
    line: (d) => {
      const fallen = Object.entries(d.career.ratings).find(
        ([, block]) => block.best !== null && block.current <= block.best - 150,
      )!
      return `Peak ${fallen[1].best} in ${fallen[0]}, now ${fallen[1].current}. That fall needs a parachute.`
    },
  },
  {
    id: 'losing-record',
    applies: (d) => d.recent.sampleSize >= 20 && d.recent.losses > d.recent.wins,
    line: (d) =>
      `${d.recent.wins} wins to ${d.recent.losses} losses in your last ${d.recent.sampleSize}. The math is not mathing in your favor.`,
  },
]

const FALLBACK: RoastRule = {
  id: 'fallback',
  applies: () => true,
  line: (d) =>
    `${d.recent.wins} wins in your last ${d.recent.sampleSize} games. Decent on paper. The board will decide if it’s true.`,
}

/** Returns up to `max` matching roast lines; always returns at least one. */
export const pickRoasts = (dossier: PlayerDossier, max = 3): string[] => {
  const lines: string[] = []
  for (const rule of RULES) {
    if (lines.length >= max) break
    if (rule.applies(dossier)) lines.push(rule.line(dossier))
  }
  return lines.length > 0 ? lines : [FALLBACK.line(dossier)]
}
