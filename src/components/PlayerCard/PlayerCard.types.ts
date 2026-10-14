import type { PlayerDossier } from '@/types/dossier.types'

export type CardReveal = 'flip' | 'instant'

export interface PlayerCardProps {
  dossier: PlayerDossier
  roast: string
  reveal: CardReveal
}
