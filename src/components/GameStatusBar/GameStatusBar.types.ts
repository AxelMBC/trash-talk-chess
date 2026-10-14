import type { Color } from 'chess.js'
import type { GameStatus } from '@/types/chess.types'

export type TurnPerspective = { mode: 'local' } | { mode: 'computer'; playerColor: Color; engineName: string }

export interface GameStatusBarProps {
  turn: Color
  status: GameStatus
  moveNumber: number
  perspective: TurnPerspective
  onExitToMenu: () => void
}
