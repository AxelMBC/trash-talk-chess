import type { CollectProgress } from '@/services/chesscom'
import type { ScoutingStage } from '@/hooks/useScoutingReport'

export interface ScoutingProgressProps {
  username: string
  stage: ScoutingStage
  progress: CollectProgress | null
}
