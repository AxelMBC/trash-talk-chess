import type { ChessComGame, ChessComProfile, ChessComStats } from '@/services/chesscom'
import {
  DOSSIER_SCHEMA_VERSION,
  type CareerSummary,
  type GameOutcome,
  type OpeningStat,
  type PlayerDossier,
  type RatingBlock,
  type RecentGamesAnalysis,
  type StreakInfo,
  type TerminationBreakdown,
  type TimeClass,
  type WinLossDrawRecord,
} from '@/types/dossier.types'

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000

const STATS_KEY_BY_TIME_CLASS: Record<TimeClass, keyof ChessComStats> = {
  rapid: 'chess_rapid',
  blitz: 'chess_blitz',
  bullet: 'chess_bullet',
  daily: 'chess_daily',
}

const TIME_CLASSES = Object.keys(STATS_KEY_BY_TIME_CLASS) as TimeClass[]

/** Result codes chess.com uses for drawn games; 'win' is a win, the rest are losses. */
const DRAW_RESULTS = new Set([
  'agreed',
  'repetition',
  'stalemate',
  'insufficient',
  '50move',
  'timevsinsufficient',
])

const TERMINATION_BY_RESULT: Record<string, keyof TerminationBreakdown> = {
  checkmated: 'checkmate',
  resigned: 'resignation',
  timeout: 'timeout',
  abandoned: 'abandonment',
}

export const buildCareerSummary = (
  profile: ChessComProfile,
  stats: ChessComStats,
): CareerSummary => {
  const joinedAt = profile.joined * 1000
  const ratings: Partial<Record<TimeClass, RatingBlock>> = {}
  let lifetimeGames = 0

  for (const timeClass of TIME_CLASSES) {
    const block = stats[STATS_KEY_BY_TIME_CLASS[timeClass]]
    if (!block) continue
    const record = {
      win: block.record?.win ?? 0,
      loss: block.record?.loss ?? 0,
      draw: block.record?.draw ?? 0,
    }
    lifetimeGames += record.win + record.loss + record.draw
    ratings[timeClass] = {
      current: block.last.rating,
      best: block.best?.rating ?? null,
      record,
    }
  }

  return {
    joinedAt,
    accountAgeYears: Math.max(0, Math.round(((Date.now() - joinedAt) / MS_PER_YEAR) * 10) / 10),
    lifetimeGames,
    ratings,
  }
}

const ECO_RE = /\[ECO "([^"]+)"\]/
const ECO_URL_RE = /\[ECOUrl "([^"]+)"\]/

/**
 * Opening name from PGN headers, no move replay. The ECOUrl slug looks like
 * "Sicilian-Defense-Open-2...Nf6" — words up to the first move-number token.
 */
export const extractOpening = (pgn: string | undefined): { eco: string | null; name: string | null } => {
  if (!pgn) return { eco: null, name: null }
  const eco = ECO_RE.exec(pgn)?.[1] ?? null
  const url = ECO_URL_RE.exec(pgn)?.[1] ?? null
  if (!url) return { eco, name: eco }

  const slug = url.split('/').pop() ?? ''
  const words: string[] = []
  for (const token of slug.split('-')) {
    if (/^\d/.test(token)) break
    words.push(token)
  }
  return { eco, name: words.length > 0 ? words.join(' ') : eco }
}

const emptyTerminations = (): TerminationBreakdown => ({
  checkmate: 0,
  resignation: 0,
  timeout: 0,
  abandonment: 0,
  other: 0,
})

const outcomeOf = (result: string): GameOutcome =>
  result === 'win' ? 'win' : DRAW_RESULTS.has(result) ? 'draw' : 'loss'

const isTimeClass = (value: string): value is TimeClass =>
  (TIME_CLASSES as string[]).includes(value)

/** `games` must be ordered newest first (as returned by `collectRecentGames`). */
export const buildRecentAnalysis = (
  games: ChessComGame[],
  username: string,
): RecentGamesAnalysis => {
  const lowerName = username.toLowerCase()
  const lossEndings = emptyTerminations()
  const winEndings = emptyTerminations()
  const openings = new Map<string, OpeningStat>()
  const timeClassCounts = new Map<TimeClass, number>()
  const counts: WinLossDrawRecord = { win: 0, loss: 0, draw: 0 }
  const outcomes: GameOutcome[] = []
  let accuracySum = 0
  let accuracyCount = 0

  for (const game of games) {
    const side = game.white.username.toLowerCase() === lowerName ? 'white' : 'black'
    const opponentSide = side === 'white' ? 'black' : 'white'
    const outcome = outcomeOf(game[side].result)
    outcomes.push(outcome)
    if (outcome === 'win') counts.win++
    else if (outcome === 'loss') counts.loss++
    else counts.draw++

    if (outcome === 'loss') {
      lossEndings[TERMINATION_BY_RESULT[game[side].result] ?? 'other']++
    } else if (outcome === 'win') {
      winEndings[TERMINATION_BY_RESULT[game[opponentSide].result] ?? 'other']++
    }

    const opening = extractOpening(game.pgn)
    if (opening.name) {
      const stat = openings.get(opening.name) ?? {
        name: opening.name,
        eco: opening.eco,
        count: 0,
        record: { win: 0, loss: 0, draw: 0 },
      }
      stat.count++
      stat.record[outcome === 'win' ? 'win' : outcome === 'loss' ? 'loss' : 'draw']++
      openings.set(opening.name, stat)
    }

    const accuracy = game.accuracies?.[side]
    if (typeof accuracy === 'number') {
      accuracySum += accuracy
      accuracyCount++
    }

    if (isTimeClass(game.time_class)) {
      timeClassCounts.set(game.time_class, (timeClassCounts.get(game.time_class) ?? 0) + 1)
    }
  }

  // Newest-first: the current streak reads forward, the longest loss streak
  // scans the whole sample regardless of order.
  let currentStreak: StreakInfo | null = null
  if (outcomes.length > 0) {
    let length = 1
    while (length < outcomes.length && outcomes[length] === outcomes[0]) length++
    currentStreak = { kind: outcomes[0], length }
  }

  let longestLossStreak = 0
  let run = 0
  for (const outcome of outcomes) {
    run = outcome === 'loss' ? run + 1 : 0
    longestLossStreak = Math.max(longestLossStreak, run)
  }

  let favoriteTimeClass: TimeClass | null = null
  for (const [timeClass, count] of timeClassCounts) {
    if (favoriteTimeClass === null || count > (timeClassCounts.get(favoriteTimeClass) ?? 0)) {
      favoriteTimeClass = timeClass
    }
  }

  return {
    sampleSize: games.length,
    wins: counts.win,
    losses: counts.loss,
    draws: counts.draw,
    lossEndings,
    winEndings,
    topOpenings: [...openings.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    longestLossStreak,
    currentStreak,
    accuracy:
      accuracyCount > 0
        ? { average: Math.round((accuracySum / accuracyCount) * 10) / 10, sampleSize: accuracyCount }
        : null,
    favoriteTimeClass,
    oldestGameAt: games.length > 0 ? games[games.length - 1].end_time * 1000 : null,
    newestGameAt: games.length > 0 ? games[0].end_time * 1000 : null,
  }
}

export const buildDossier = (
  username: string,
  profile: ChessComProfile,
  stats: ChessComStats,
  games: ChessComGame[],
): PlayerDossier => ({
  schemaVersion: DOSSIER_SCHEMA_VERSION,
  username: profile.username ?? username,
  fetchedAt: Date.now(),
  career: buildCareerSummary(profile, stats),
  recent: buildRecentAnalysis(games, profile.username ?? username),
})

const cacheKey = (username: string) => `ttc:dossier:${username.toLowerCase()}`

export const loadCachedDossier = (username: string): PlayerDossier | null => {
  try {
    const raw = localStorage.getItem(cacheKey(username))
    if (!raw) return null
    const dossier = JSON.parse(raw) as PlayerDossier
    return dossier.schemaVersion === DOSSIER_SCHEMA_VERSION ? dossier : null
  } catch {
    return null
  }
}

export const saveDossier = (dossier: PlayerDossier) => {
  try {
    localStorage.setItem(cacheKey(dossier.username), JSON.stringify(dossier))
  } catch {
    // Quota/private-mode failures just mean no cache — never block the report.
  }
}
