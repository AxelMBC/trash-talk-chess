import { useEffect, useRef, useState } from 'react'
import type { Color } from 'chess.js'
import type { ChessGame } from '@/hooks/useChessGame'
import { createEngine, ENGINE_PRESETS } from '@/services/engine'
import type { EngineError, EngineHandle, SearchReport } from '@/services/engine'
import type { Difficulty } from '@/types/chess.types'
import { isGameOver } from '@/utils/board'

/** Floor on perceived think time so engine replies never feel teleported. */
const MIN_THINK_DELAY_MS = 400

export type EngineStatus = 'off' | 'loading' | 'idle' | 'thinking' | 'error'

export interface EngineOpponentConfig {
  /** When false the hook is inert (pass-and-play games). */
  enabled: boolean
  difficulty: Difficulty
  engineColor: Color
}

export interface EngineOpponent {
  engineStatus: EngineStatus
  engineError: EngineError | null
  /** Deepest score seen in the engine's latest completed search (for trash talk). */
  lastReport: SearchReport | null
}

/**
 * Layers an engine opponent on top of `useChessGame` without touching it:
 * watches the turn, asks Stockfish for a move, and plays it through the same
 * `makeMove` path as human moves so all animations behave identically.
 * Engine promotions carry the promotion piece directly, so the promotion
 * dialog (which only opens via `selectSquare`) never appears for the engine.
 */
const useEngineOpponent = (game: ChessGame, config: EngineOpponentConfig): EngineOpponent => {
  const { enabled, difficulty, engineColor } = config
  const preset = ENGINE_PRESETS[difficulty]

  const [engineStatus, setEngineStatus] = useState<EngineStatus>(enabled ? 'loading' : 'off')
  const [engineError, setEngineError] = useState<EngineError | null>(null)
  // Tagged with its game so a rematch never exposes the previous game's score,
  // not even in the render before the rematch effect runs.
  const [taggedReport, setTaggedReport] = useState<{
    gameId: number
    report: SearchReport | null
  } | null>(null)
  const [ready, setReady] = useState(false)
  const handleRef = useRef<EngineHandle | null>(null)
  // Bumped on rematch/unmount; async continuations from an older generation
  // must never touch the current game.
  const generationRef = useRef(0)
  const seenGameIdRef = useRef(game.gameId)

  // Engine lifecycle: one worker per mounted vs-computer game.
  useEffect(() => {
    if (!enabled) return
    let disposed = false
    let engineHandle: EngineHandle | null = null
    setEngineStatus('loading')

    void createEngine().then((result) => {
      if (disposed) {
        if (result.ok) result.value.dispose()
        return
      }
      if (!result.ok) {
        setEngineError(result.error)
        setEngineStatus('error')
        return
      }
      engineHandle = result.value
      handleRef.current = result.value
      result.value.newGame(preset)
      setReady(true)
      setEngineStatus('idle')
    })

    return () => {
      disposed = true
      // Not DOM refs: invalidating the generation and clearing the engine
      // handle on teardown is the point.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generationRef.current++
      engineHandle?.dispose()
      handleRef.current = null
    }
    // Difficulty is fixed for the lifetime of a game screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // Rematch: discard in-flight searches and reset the engine. Declared before
  // the turn loop so the new game's first search sees the bumped generation.
  useEffect(() => {
    if (game.gameId === seenGameIdRef.current) return
    seenGameIdRef.current = game.gameId
    if (!enabled) return
    generationRef.current++
    handleRef.current?.newGame(preset)
    if (handleRef.current) setEngineStatus('idle')
    // Difficulty is fixed for the lifetime of a game screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameId, enabled])

  // Turn loop: when it's the engine's move, think, then play.
  useEffect(() => {
    if (!enabled || !ready) return
    const handle = handleRef.current
    if (!handle) return
    if (game.turn !== engineColor || isGameOver(game.status) || game.pendingPromotion) return

    const generation = generationRef.current
    const { gameId } = game
    let cancelled = false
    setEngineStatus('thinking')

    const think = async () => {
      const startedAt = Date.now()
      const result = await handle.bestMove(game.getFen(), preset)
      const remaining = MIN_THINK_DELAY_MS - (Date.now() - startedAt)
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
      if (cancelled || generation !== generationRef.current) return

      if (!result.ok) {
        if (result.error.kind === 'stale') return
        setEngineError(result.error)
        setEngineStatus('error')
        return
      }

      // Report first, move second: React batches both, so consumers see the
      // new score and the new position in the same render.
      setTaggedReport({ gameId, report: result.value.report })
      game.makeMove(result.value.move.from, result.value.move.to, result.value.move.promotion)
      setEngineStatus('idle')
    }
    void think()

    return () => {
      cancelled = true
    }
    // `game`'s callbacks are recreated per render; the triggers are the deps below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ready, engineColor, game.turn, game.status, game.pendingPromotion, game.gameId])

  const lastReport = taggedReport?.gameId === game.gameId ? taggedReport.report : null

  return { engineStatus, engineError, lastReport }
}

export default useEngineOpponent
