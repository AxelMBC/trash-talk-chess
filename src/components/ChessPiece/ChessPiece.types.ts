import type { TrackedPiece } from '@/types/chess.types'

export interface ChessPieceProps {
  piece: TrackedPiece
  /** Visual column (0-7, left to right) for the current orientation. */
  col: number
  /** Visual row (0-7, top to bottom) for the current orientation. */
  row: number
  /** Renders above other pieces so the gliding piece isn't drawn underneath. */
  isElevated: boolean
}
