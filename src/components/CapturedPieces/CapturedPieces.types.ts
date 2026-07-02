import type { Color } from 'chess.js'
import type { CapturedByColor } from '@/types/chess.types'

export interface CapturedPiecesProps {
  /** The player whose captures are displayed. */
  color: Color
  captured: CapturedByColor
}
