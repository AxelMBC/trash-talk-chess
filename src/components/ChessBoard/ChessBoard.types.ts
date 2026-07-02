import type { Color, Move, Square } from 'chess.js'
import type { LastMove, TrackedPiece } from '@/types/chess.types'

export interface ChessBoardProps {
  pieces: TrackedPiece[]
  orientation: Color
  selectedSquare: Square | null
  legalMoves: Move[]
  lastMove: LastMove | null
  checkSquare: Square | null
  disabled: boolean
  onSquareClick: (square: Square) => void
}
