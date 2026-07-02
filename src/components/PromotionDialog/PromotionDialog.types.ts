import type { PendingPromotion, PromotionPiece } from '@/types/chess.types'

export interface PromotionDialogProps {
  promotion: PendingPromotion | null
  onSelect: (piece: PromotionPiece) => void
  onCancel: () => void
}
