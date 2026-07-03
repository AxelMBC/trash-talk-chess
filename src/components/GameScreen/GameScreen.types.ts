import type { GameConfig } from '@/types/chess.types'

export interface GameScreenProps {
  config: GameConfig
  onExitToMenu: () => void
}
