import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { motion } from 'motion/react'
import type { PieceSymbol } from 'chess.js'
import { PIECE_IMAGES, PIECE_NAMES, PIECE_VALUES } from '@/utils/pieces'
import { colorName } from '@/utils/board'
import type { CapturedPiecesProps } from './CapturedPieces.types'

const materialValue = (pieces: PieceSymbol[]): number =>
  pieces.reduce((sum, piece) => sum + PIECE_VALUES[piece], 0)

/** Keys by type and occurrence, so re-sorting on a new capture doesn't remount the pieces already shown. */
const withStableKeys = (pieces: PieceSymbol[]): { piece: PieceSymbol; key: string }[] => {
  const seen: Partial<Record<PieceSymbol, number>> = {}
  return pieces.map((piece) => {
    const nth = seen[piece] ?? 0
    seen[piece] = nth + 1
    return { piece, key: `${piece}-${nth}` }
  })
}

const CapturedPieces = ({ color, captured }: CapturedPiecesProps) => {
  const enemyColor = color === 'w' ? 'b' : 'w'
  const taken = withStableKeys(
    [...captured[color]].sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a]),
  )
  const advantage = materialValue(captured[color]) - materialValue(captured[enemyColor])

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minHeight: 26, px: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mr: 0.5 }}>
        {colorName(color)}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {taken.map(({ piece, key }, index) => (
          <motion.img
            key={key}
            src={PIECE_IMAGES[enemyColor][piece]}
            alt={`Captured ${PIECE_NAMES[piece]}`}
            initial={{ scale: 0, y: -6 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 24 }}
            style={{ width: 22, height: 22, marginLeft: index === 0 ? 0 : -7 }}
          />
        ))}
      </Box>
      {advantage > 0 && (
        <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 800 }}>
          +{advantage}
        </Typography>
      )}
    </Box>
  )
}

export default CapturedPieces
