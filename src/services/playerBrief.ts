import { loadCachedDossier } from '@/services/dossier'
import type { PlayerDossier } from '@/types/dossier.types'
import type { PlayerProfile, PlayerProfileFacts } from '@/types/trashTalk.types'

/**
 * Bridges the scouting dossier into trash talk: remembers who was scouted
 * last, and renders their dossier into a compact markdown brief (the
 * LLM-facing profile) plus structured facts (for static line predicates).
 * Derived on demand so the brief never goes stale relative to the dossier.
 */
const LAST_SCOUT_KEY = 'ttc:last-scout'

/** Call whenever a dossier becomes ready so games know whose file to pull. */
export const rememberScoutedPlayer = (username: string) => {
  try {
    localStorage.setItem(LAST_SCOUT_KEY, username.toLowerCase())
  } catch {
    // No storage just means no personalization.
  }
}

const bestCurrentRating = (dossier: PlayerDossier): number | null => {
  const ratings = Object.values(dossier.career.ratings).map((block) => block.current)
  return ratings.length > 0 ? Math.max(...ratings) : null
}

export const dossierToBrief = (d: PlayerDossier): string => {
  const lines: string[] = [`# Scouting brief: ${d.username}`]
  lines.push(
    `- Account: ${d.career.accountAgeYears} years old, ${d.career.lifetimeGames} lifetime games`,
  )
  const ratings = Object.entries(d.career.ratings)
    .map(([tc, block]) => `${tc} ${block.current}${block.best !== null ? ` (peak ${block.best})` : ''}`)
    .join(', ')
  if (ratings) lines.push(`- Ratings: ${ratings}`)
  const r = d.recent
  if (r.sampleSize > 0) {
    lines.push(`- Last ${r.sampleSize} games: ${r.wins}W-${r.losses}L-${r.draws}D`)
    if (r.accuracy) lines.push(`- Average accuracy: ${r.accuracy.average}%`)
    if (r.topOpenings.length > 0) {
      lines.push(
        `- Favorite openings: ${r.topOpenings
          .slice(0, 3)
          .map((o) => `${o.name} (${o.count})`)
          .join(', ')}`,
      )
    }
    lines.push(
      `- Loss habits: ${r.lossEndings.checkmate} checkmated, ${r.lossEndings.resignation} resigned, ${r.lossEndings.timeout} timed out`,
    )
    if (r.longestLossStreak >= 3) lines.push(`- Longest recent loss streak: ${r.longestLossStreak}`)
    if (r.currentStreak && r.currentStreak.length >= 2) {
      lines.push(`- Current streak: ${r.currentStreak.length} ${r.currentStreak.kind}s`)
    }
  } else {
    lines.push('- No recent games on record')
  }
  return lines.join('\n')
}

const factsFrom = (d: PlayerDossier): PlayerProfileFacts => ({
  username: d.username,
  rating: bestCurrentRating(d),
  accountAgeYears: d.career.accountAgeYears,
  recentRecord: `${d.recent.wins}W-${d.recent.losses}L-${d.recent.draws}D`,
  topOpening: d.recent.topOpenings[0]?.name ?? null,
  timeoutLosses: d.recent.lossEndings.timeout,
})

/** Profile of the most recently scouted player, or null when none exists. */
export const getPlayerProfile = (): PlayerProfile | null => {
  try {
    const username = localStorage.getItem(LAST_SCOUT_KEY)
    if (!username) return null
    const dossier = loadCachedDossier(username)
    if (!dossier) return null
    return { brief: dossierToBrief(dossier), facts: factsFrom(dossier) }
  } catch {
    return null
  }
}
