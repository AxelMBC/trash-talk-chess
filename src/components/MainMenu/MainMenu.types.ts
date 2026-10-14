import type { Difficulty } from '@/types/chess.types'

export interface MainMenuProps {
  onPlayLocal: () => void
  onPlayComputer: (difficulty: Difficulty) => void
  onScout: (username: string) => void
}

/** `dismissed` is `closed` reached via back/Escape, so focus returns to the vs Computer button. */
export type ComputerEntry = 'closed' | 'picking' | 'dismissed'
