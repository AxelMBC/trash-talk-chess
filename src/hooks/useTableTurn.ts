import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { Color } from 'chess.js'
import { animate, useMotionValue, useReducedMotion } from 'motion/react'
import type { AnimationPlaybackControls, MotionValue } from 'motion/react'
import type { GameStatus } from '@/types/chess.types'
import { isGameOver } from '@/utils/board'

/** Overlap window: the orbit starts gently while the moved piece finishes its glide. */
const TURN_DELAY_MS = 200
/** Scale the board drops to while "lifted off the table" during the turn. */
const LIFT_SCALE = 0.94
/** 3D tilt (degrees) applied with the lift, flattened back out on settle. */
const LIFT_TILT_DEG = 8

export interface TableTurnConfig {
  /** When false the board stays fixed at `homeOrientation` (vs-computer games). */
  enabled: boolean
  /** Orientation for a fresh game, and the fixed one when disabled. */
  homeOrientation: Color
}

export interface TableTurn {
  orientation: Color
  isTurning: boolean
  boardRotation: MotionValue<number>
  boardScale: MotionValue<number>
  boardTilt: MotionValue<number>
  /** Call on rematch: stops the turn in flight and puts the board back at home. */
  reset: () => void
}

/**
 * Pass-and-play table turn: after each move the board lifts, orbits 180° in
 * plane and settles back facing the player to move.
 */
const useTableTurn = (turn: Color, status: GameStatus, config: TableTurnConfig): TableTurn => {
  const { enabled, homeOrientation } = config
  const [orientation, setOrientation] = useState<Color>(homeOrientation)
  const [isTurning, setIsTurning] = useState(false)
  const boardRotation = useMotionValue(0)
  const boardScale = useMotionValue(1)
  const boardTilt = useMotionValue(0)
  const reduceMotion = useReducedMotion()
  const prevTurnRef = useRef<Color>('w')
  /** Rematch can leave `turn` unchanged, so `reset` stops the turn in flight itself. */
  const cancelTurnRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!enabled) return
    if (turn === prevTurnRef.current) return
    prevTurnRef.current = turn
    if (isGameOver(status)) return

    let cancelled = false
    const controls: AnimationPlaybackControls[] = []
    setIsTurning(true)

    const turnTable = async () => {
      await new Promise((resolve) => setTimeout(resolve, TURN_DELAY_MS))
      if (cancelled) return
      if (reduceMotion) {
        setOrientation(turn)
        setIsTurning(false)
        return
      }
      // Lift: the board comes slightly off the table as the orbit begins.
      controls.push(
        animate(boardScale, LIFT_SCALE, { duration: 0.18, ease: 'easeOut' }),
        animate(boardTilt, LIFT_TILT_DEG, { duration: 0.18, ease: 'easeOut' }),
      )
      // Orbit: one continuous in-plane half turn, decelerating into place.
      const orbit = animate(boardRotation, 180, { duration: 0.52, ease: [0.45, 0, 0.15, 1] })
      controls.push(orbit)
      await orbit
      if (cancelled) return
      // A board rotated 180° is pixel-identical to the swapped orientation at 0°,
      // so committing both in the same paint makes the state swap invisible.
      // Reset the rotation FIRST: the piece layer remounts on the orientation swap,
      // and its counter-rotations must initialize from 0, not the stale 180.
      boardRotation.jump(0)
      flushSync(() => setOrientation(turn))
      // Settle: back down onto the table with a bit of spring.
      const settle = [
        animate(boardScale, 1, { type: 'spring', stiffness: 320, damping: 22 }),
        animate(boardTilt, 0, { type: 'spring', stiffness: 320, damping: 22 }),
      ]
      controls.push(...settle)
      await Promise.all(settle)
      if (cancelled) return
      setIsTurning(false)
    }
    void turnTable()

    const cancelTurn = () => {
      cancelled = true
      controls.forEach((control) => control.stop())
    }
    cancelTurnRef.current = cancelTurn
    return cancelTurn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn])

  const reset = () => {
    cancelTurnRef.current()
    prevTurnRef.current = 'w'
    setOrientation(homeOrientation)
    setIsTurning(false)
    boardRotation.jump(0)
    boardScale.jump(1)
    boardTilt.jump(0)
  }

  return { orientation, isTurning, boardRotation, boardScale, boardTilt, reset }
}

export default useTableTurn
