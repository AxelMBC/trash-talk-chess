import type { Color } from 'chess.js'
import type { CapturedByColor } from '@/types/chess.types'

export type PlayerActivity = 'loading' | 'thinking'

export interface CapturedPiecesProps {
  /** The player whose captures are displayed. */
  color: Color
  captured: CapturedByColor
  name: string
  activity?: PlayerActivity | null
}
