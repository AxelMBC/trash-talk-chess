import type { Square } from 'chess.js'

export interface BoardSquareProps {
  square: Square
  isDark: boolean
  isSelected: boolean
  isLegalTarget: boolean
  isCaptureTarget: boolean
  isLastMove: boolean
  isCheck: boolean
  fileLabel?: string
  rankLabel?: string
  /** Fades coordinate labels out during the turn transition. */
  labelsHidden: boolean
  onClick: (square: Square) => void
}
