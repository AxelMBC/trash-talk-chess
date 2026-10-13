import type { Difficulty } from '@/types/chess.types'
import type { MoveQuality } from '@/utils/moveQuality'
import type { MoveEvent } from '@/utils/tactics'

/**
 * The trash-talk contract: everything a line source may want to know about
 * the moment it is reacting to, assembled fresh per trigger. A future LLM
 * source receives exactly this object (plus the persona document) and nothing
 * else — keep it plain-JSON serializable.
 */
export type TrashTalkCategory =
  | 'playerBad'
  | 'playerNeutral'
  | 'playerGood'
  | 'fork'
  | 'capture'
  | 'check'
  | 'promotion'
  | 'engineMove'
  | 'engineMateSoon'
  | 'engineCrushing'
  | 'slowPlay'

/** Who is better and by how much, in both machine and human terms. */
export interface PositionAdvantage {
  /** Centipawns from the engine's perspective (positive = engine better). */
  cp: number
  label: 'engine crushing' | 'engine ahead' | 'balanced' | 'player ahead' | 'player crushing'
  /** Plain-language rendering, e.g. "engine up 2.3 pawns". */
  text: string
}

/** Per-game running memory, reset on rematch. */
export interface SessionStats {
  moveNumber: number
  /** Bad moves by the player so far this game (fuel for escalation lines). */
  playerBlunders: number
  /** Bank line ids already said this game (no repeats while alternatives exist). */
  saidLineIds: string[]
  /** Seconds the player spent on their last completed move, when known. */
  thinkSeconds: number | null
}

/** Structured facts pulled from the scouting dossier for quick line predicates. */
export interface PlayerProfileFacts {
  username: string
  /** Best current rating across time classes, if any. */
  rating: number | null
  accountAgeYears: number
  /** Recent record as "12W-25L-3D". */
  recentRecord: string
  topOpening: string | null
  /** Recent losses that ended on the clock. */
  timeoutLosses: number
}

export interface PlayerProfile {
  /** Markdown scouting brief — the LLM-facing rendering of the dossier. */
  brief: string
  facts: PlayerProfileFacts
}

export interface TrashTalkMoment {
  category: TrashTalkCategory
  difficulty: Difficulty
  fen: string
  /** Moves played so far, as PGN movetext. */
  pgn: string
  lastMoveSan: string | null
  /** Verdict on the player's last move; null for non-player triggers. */
  quality: MoveQuality | null
  event: MoveEvent | null
  advantage: PositionAdvantage
  /** Moves until the engine's forced mate, when its search found one. */
  mateIn: number | null
  session: SessionStats
  /** Present only when a scouted player's dossier exists. */
  profile: PlayerProfile | null
}

/** A resolved line: the id feeds session no-repeat tracking. */
export interface PickedLine {
  id: string
  text: string
}
