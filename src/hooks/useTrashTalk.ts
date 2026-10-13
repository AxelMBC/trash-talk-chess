import { useEffect, useRef, useState } from 'react'
import type { Color } from 'chess.js'
import type { ChessGame } from '@/hooks/useChessGame'
import type { EngineStatus } from '@/hooks/useEngineOpponent'
import type { SearchReport } from '@/services/engine'
import { activeLineSource, resolveLine } from '@/services/lineSource'
import { getPlayerProfile } from '@/services/playerBrief'
import type {
  PlayerProfile,
  TrashTalkCategory,
  TrashTalkLine,
  TrashTalkMoment,
} from '@/types/trashTalk.types'
import { advantageFromCp, classifyPlayerMove, CRUSHING_CP, scoreToCp } from '@/utils/moveQuality'
import type { MoveQuality } from '@/utils/moveQuality'
import { detectEvent } from '@/utils/tactics'
import type { MoveEvent } from '@/utils/tactics'
import type { Difficulty } from '@/types/chess.types'
import { isGameOver } from '@/utils/board'

/** How long a line stays on screen before dismissing itself. */
const LINE_TTL_MS = 10_000
/** Player think time on one turn before the engine starts nagging. */
const SLOW_PLAY_THRESHOLD_MS = 30_000

export interface TrashTalkConfig {
  /** When false the hook is inert (pass-and-play games). */
  enabled: boolean
  difficulty: Difficulty
  playerColor: Color
  engineStatus: EngineStatus
  /** Latest completed search report from `useEngineOpponent`. */
  lastReport: SearchReport | null
}

interface ShowExtras {
  quality?: MoveQuality
  event?: MoveEvent
  mateIn?: number
}

/**
 * The engine's running commentary. Watches the game for completed moves,
 * judges the player's moves with the engine's own search scores (design D1:
 * consecutive reply-search deltas, no extra searches), assembles a
 * `TrashTalkMoment` per trigger, and resolves it through the swappable async
 * line source (design D8/D9). Everything here is fire-and-forget: failures
 * are swallowed and the move pipeline never waits on this hook.
 */
const useTrashTalk = (
  game: ChessGame,
  config: TrashTalkConfig,
): { line: TrashTalkLine | null } => {
  const { enabled, difficulty, playerColor, engineStatus, lastReport } = config
  const [line, setLine] = useState<TrashTalkLine | null>(null)

  /** Engine-perspective cp of the previous search; 0 ≈ the starting position. */
  const prevScoreRef = useRef(0)
  /** Set when a quiet player move is waiting on the engine's score to be judged. */
  const awaitingQualityRef = useRef(false)
  const seenReportRef = useRef<SearchReport | null>(null)
  const ttlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Stamps line requests; resolutions that lost to a newer request are dropped. */
  const requestSeqRef = useRef(0)

  // Session memory (design D12) — reset on rematch.
  const profileRef = useRef<PlayerProfile | null>(null)
  const playerBlundersRef = useRef(0)
  const saidIdsRef = useRef<string[]>([])
  const turnStartedAtRef = useRef<number | null>(null)
  const thinkSecondsRef = useRef<number | null>(null)

  const buildMoment = (category: TrashTalkCategory, extras?: ShowExtras): TrashTalkMoment => ({
    category,
    difficulty,
    fen: game.getFen(),
    pgn: game.getPgn(),
    lastMoveSan: game.getLastMove()?.san ?? null,
    quality: extras?.quality ?? null,
    event: extras?.event ?? null,
    advantage: advantageFromCp(prevScoreRef.current),
    mateIn: extras?.mateIn ?? null,
    session: {
      moveNumber: game.moveNumber,
      playerBlunders: playerBlundersRef.current,
      saidLineIds: [...saidIdsRef.current],
      thinkSeconds: thinkSecondsRef.current,
    },
    profile: profileRef.current,
  })

  const show = (category: TrashTalkCategory, extras?: ShowExtras) => {
    try {
      const moment = buildMoment(category, extras)
      const seq = ++requestSeqRef.current
      void resolveLine(activeLineSource, moment).then((picked) => {
        if (!picked || seq !== requestSeqRef.current) return
        saidIdsRef.current.push(picked.id)
        if (ttlTimerRef.current) clearTimeout(ttlTimerRef.current)
        setLine({ id: `${picked.id}-${seq}`, text: picked.text })
        ttlTimerRef.current = setTimeout(() => setLine(null), LINE_TTL_MS)
      })
    } catch {
      // Trash talk must never break the game.
    }
  }

  // Rematch (and first mount): wipe all commentary and session state.
  useEffect(() => {
    if (game.lastMove !== null) return
    prevScoreRef.current = 0
    awaitingQualityRef.current = false
    seenReportRef.current = null
    playerBlundersRef.current = 0
    saidIdsRef.current = []
    thinkSecondsRef.current = null
    requestSeqRef.current++
    if (ttlTimerRef.current) clearTimeout(ttlTimerRef.current)
    setLine(null)
    if (enabled) profileRef.current = getPlayerProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.lastMove, enabled])

  // Stopwatch for the player's think time on each of their turns.
  useEffect(() => {
    if (enabled && game.turn === playerColor) turnStartedAtRef.current = Date.now()
  }, [enabled, game.turn, playerColor])

  // Player moved: react instantly to showy events (fork/promotion/check/
  // capture); quiet moves wait for the engine's score to be judged.
  useEffect(() => {
    if (!enabled || game.turn === playerColor || !game.lastMove) return
    if (isGameOver(game.status)) return
    try {
      const move = game.getLastMove()
      if (!move || move.color !== playerColor) return
      thinkSecondsRef.current = turnStartedAtRef.current
        ? Math.round((Date.now() - turnStartedAtRef.current) / 1000)
        : null
      const event = detectEvent(move)
      if (event) {
        awaitingQualityRef.current = false
        show(event, { event })
      } else {
        awaitingQualityRef.current = true
      }
    } catch {
      awaitingQualityRef.current = false
    }
    // `game`'s accessors are recreated per render; the triggers are the deps below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, playerColor, game.turn, game.lastMove])

  // Engine replied: the reply moment carries exactly ONE line — a forced-mate
  // countdown beats everything, then a pending quality verdict on the
  // player's quiet move, then the engine's own taunt. Lines only ever appear
  // when a move lands (spec: no lines out of nowhere).
  useEffect(() => {
    if (!enabled || !lastReport || lastReport === seenReportRef.current) return
    seenReportRef.current = lastReport
    const cp = scoreToCp(lastReport.score)
    const delta = cp - prevScoreRef.current
    prevScoreRef.current = cp
    if (isGameOver(game.status) || game.turn !== playerColor) return

    const quality = classifyPlayerMove(delta)
    if (quality === 'bad') playerBlundersRef.current++
    const engineMating = lastReport.score.type === 'mate' && lastReport.score.value > 0
    const mateIn = engineMating ? lastReport.score.value : undefined
    const qualityPending = awaitingQualityRef.current
    awaitingQualityRef.current = false

    if (engineMating) {
      show('engineMateSoon', { mateIn })
    } else if (qualityPending) {
      show(quality === 'bad' ? 'playerBad' : quality === 'good' ? 'playerGood' : 'playerNeutral', {
        quality,
      })
    } else {
      show(cp >= CRUSHING_CP ? 'engineCrushing' : 'engineMove')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, playerColor, lastReport, game.turn, game.status])

  // Slow-play nag: armed while the player thinks, fires at most once per turn.
  useEffect(() => {
    if (!enabled || game.turn !== playerColor || engineStatus !== 'idle') return
    if (isGameOver(game.status)) return
    const timer = setTimeout(() => show('slowPlay'), SLOW_PLAY_THRESHOLD_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, playerColor, game.turn, game.status, engineStatus])

  // Unmount: nothing may fire into a dead screen.
  useEffect(
    () => () => {
      // Timer handles and the request stamp, not DOM refs; invalidating them
      // on teardown is the point.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestSeqRef.current++
      if (ttlTimerRef.current) clearTimeout(ttlTimerRef.current)
    },
    [],
  )

  return { line: enabled ? line : null }
}

export default useTrashTalk
