import type { Color, Move, Square } from 'chess.js'
import type { MotionValue } from 'motion/react'
import type { LastMove, TrackedPiece } from '@/types/chess.types'

export interface ChessBoardProps {
  pieces: TrackedPiece[]
  orientation: Color
  /** Live board rotation (degrees) during the turn transition; pieces counter-rotate against it. */
  boardRotation: MotionValue<number>
  /** Fades out coordinate labels while the board is turning (their text changes at the swap). */
  labelsHidden: boolean
  selectedSquare: Square | null
  legalMoves: Move[]
  lastMove: LastMove | null
  checkSquare: Square | null
  disabled: boolean
  onSquareClick: (square: Square) => void
}
