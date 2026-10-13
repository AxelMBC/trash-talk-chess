import type { Difficulty } from '@/types/chess.types'

export interface MainMenuProps {
  onPlayLocal: () => void
  onPlayComputer: (difficulty: Difficulty) => void
  onScout: (username: string) => void
}

/** `dismissed` is `closed` reached via back/Escape, so focus returns to the vs Computer button. */
export type ComputerEntry = 'closed' | 'picking' | 'dismissed'

export interface FloatingPieceConfig {
  image: string
  size: number
  top: string
  left: string
  duration: number
  delay: number
  opacity: number
}
