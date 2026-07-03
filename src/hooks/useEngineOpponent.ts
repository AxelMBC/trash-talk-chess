import { useCallback, useEffect, useRef, useState } from 'react'
import type { Color } from 'chess.js'
import type { ChessGame } from '@/hooks/useChessGame'
import { createEngine, ENGINE_PRESETS } from '@/services/engine'
import type { EngineError, EngineHandle } from '@/services/engine'
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
  /** Call on rematch: discards in-flight searches and resets the engine. */
  startNewGame: () => void
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
  const [ready, setReady] = useState(false)
  const handleRef = useRef<EngineHandle | null>(null)
  // Bumped on rematch/unmount; async continuations from an older generation
  // must never touch the current game.
  const generationRef = useRef(0)

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

  // Turn loop: when it's the engine's move, think, then play.
  useEffect(() => {
    if (!enabled || !ready) return
    const handle = handleRef.current
    if (!handle) return
    if (game.turn !== engineColor || isGameOver(game.status) || game.pendingPromotion) return

    const generation = generationRef.current
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

      game.makeMove(result.value.from, result.value.to, result.value.promotion)
      setEngineStatus('idle')
    }
    void think()

    return () => {
      cancelled = true
    }
    // `game`'s callbacks are recreated per render; the triggers are the deps below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ready, engineColor, game.turn, game.status, game.pendingPromotion])

  const startNewGame = useCallback(() => {
    if (!enabled) return
    generationRef.current++
    handleRef.current?.newGame(preset)
    if (handleRef.current) setEngineStatus('idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, preset])

  return { engineStatus, engineError, startNewGame }
}

export default useEngineOpponent
