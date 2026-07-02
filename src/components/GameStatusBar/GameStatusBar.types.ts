import type { Color } from 'chess.js'
import type { GameStatus } from '@/types/chess.types'

export interface GameStatusBarProps {
  turn: Color
  status: GameStatus
  moveNumber: number
}
