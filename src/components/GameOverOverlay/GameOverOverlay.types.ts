import type { Color } from 'chess.js'
import type { GameStatus } from '@/types/chess.types'

export interface GameOverOverlayProps {
  status: GameStatus
  winner: Color | null
  onRematch: () => void
  onMenu: () => void
}
