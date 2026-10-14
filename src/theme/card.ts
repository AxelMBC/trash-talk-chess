import type { PieceSymbol } from 'chess.js'
import { STICKER_COLORS, STICKER_PALETTE } from '@/theme/theme'
import { hardShadow } from '@/theme/sticker'

export interface CardTier {
  name: string
  piece: PieceSymbol
  color: string
}

export const CARD_WIDTH = 350
export const CARD_ASPECT_RATIO = '5 / 7.4'
export const CARD_RADIUS = '16px'

export const CARD_FACE_SX = {
  border: `3px solid ${STICKER_COLORS.ink}`,
  borderRadius: CARD_RADIUS,
  boxShadow: hardShadow(8),
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
} as const

export const CARD_TIERS: readonly (CardTier & { minRating: number })[] = [
  { minRating: 0, name: 'Common', piece: 'p', color: STICKER_PALETTE.cream },
  { minRating: 1000, name: 'Uncommon', piece: 'n', color: STICKER_PALETTE.teal },
  { minRating: 1400, name: 'Rare', piece: 'b', color: STICKER_PALETTE.blue },
  { minRating: 1800, name: 'Epic', piece: 'r', color: STICKER_PALETTE.pink },
  { minRating: 2200, name: 'Legendary', piece: 'q', color: STICKER_PALETTE.gold },
]

export const cardTier = (rating: number | null): CardTier =>
  CARD_TIERS.findLast((tier) => (rating ?? 0) >= tier.minRating) ?? CARD_TIERS[0]
