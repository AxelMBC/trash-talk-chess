/** Bump when derivation logic changes so stale cached dossiers are rebuilt. */
export const DOSSIER_SCHEMA_VERSION = 1

export type TimeClass = 'rapid' | 'blitz' | 'bullet' | 'daily'

export type GameOutcome = 'win' | 'loss' | 'draw'

export interface WinLossDrawRecord {
  win: number
  loss: number
  draw: number
}

export interface RatingBlock {
  current: number
  best: number | null
  record: WinLossDrawRecord
}

/** Career-wide facts derived from profile + stats only (no archive downloads). */
export interface CareerSummary {
  joinedAt: number
  accountAgeYears: number
  lifetimeGames: number
  ratings: Partial<Record<TimeClass, RatingBlock>>
}

/** How games ended, from the dossier owner's perspective. */
export interface TerminationBreakdown {
  checkmate: number
  resignation: number
  timeout: number
  abandonment: number
  other: number
}

export interface OpeningStat {
  name: string
  eco: string | null
  count: number
  record: WinLossDrawRecord
}

export interface StreakInfo {
  kind: GameOutcome
  length: number
}

export interface AccuracySummary {
  average: number
  /** Number of games the average is based on (not all games carry accuracies). */
  sampleSize: number
}

/** Deep analysis of the player's most recent games (up to 100). */
export interface RecentGamesAnalysis {
  sampleSize: number
  wins: number
  losses: number
  draws: number
  /** How the player's losses ended. */
  lossEndings: TerminationBreakdown
  /** How the player's wins ended (i.e. what happened to the opponent). */
  winEndings: TerminationBreakdown
  topOpenings: OpeningStat[]
  longestLossStreak: number
  currentStreak: StreakInfo | null
  accuracy: AccuracySummary | null
  favoriteTimeClass: TimeClass | null
  oldestGameAt: number | null
  newestGameAt: number | null
}

/**
 * The scouting contract: everything the report screen (and, later, the
 * trash-talk engine) knows about a player. Must stay plain-JSON serializable —
 * it is persisted to localStorage and will be embedded in LLM prompts.
 */
export interface PlayerDossier {
  schemaVersion: number
  username: string
  fetchedAt: number
  career: CareerSummary
  recent: RecentGamesAnalysis
}
