import type { Move } from 'chess.js'

export interface MoveListProps {
  moves: Move[]
  viewPly: number
  isLive: boolean
  disabled: boolean
  onViewMove: (ply: number) => void
  onStepView: (delta: number) => void
  onViewLive: () => void
}
