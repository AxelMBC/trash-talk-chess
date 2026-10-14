import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { PieceSymbol } from 'chess.js'
import { STICKER_COLORS } from '@/theme/theme'
import { STICKER_RADIUS, hardShadow } from '@/theme/sticker'
import { PIECE_IMAGES, PIECE_NAMES, PIECE_VALUES } from '@/utils/pieces'
import type { CapturedPiecesProps, PlayerActivity } from './CapturedPieces.types'

const ACTIVITY_LABELS: Record<PlayerActivity, string> = {
  loading: 'Warming up…',
  thinking: 'Thinking…',
}

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

const CapturedPieces = ({ color, captured, name, activity = null }: CapturedPiecesProps) => {
  const reduceMotion = useReducedMotion()
  const enemyColor = color === 'w' ? 'b' : 'w'
  const taken = withStableKeys(
    [...captured[color]].sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a]),
  )
  const advantage = materialValue(captured[color]) - materialValue(captured[enemyColor])

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        minHeight: 36,
        px: 1.25,
        py: 0.25,
        bgcolor: 'background.paper',
        border: `2.5px solid ${STICKER_COLORS.ink}`,
        borderRadius: STICKER_RADIUS,
        boxShadow: hardShadow(3),
      }}
    >
      <Typography
        sx={{
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '0.85rem',
          fontWeight: 800,
          whiteSpace: 'nowrap',
          mr: 0.5,
        }}
      >
        {name}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden', p: '3px', m: '-3px' }}>
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
        <Typography variant="caption" sx={{ flexShrink: 0, color: 'secondary.main', fontWeight: 800 }}>
          +{advantage}
        </Typography>
      )}
      <AnimatePresence>
        {activity && (
          <motion.div
            key={activity}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 0.55, 1] }}
            // Exit must override the infinite pulse, or AnimatePresence
            // never finishes removing the text.
            exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.18 } }}
            transition={reduceMotion ? { duration: 0 } : { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ flexShrink: 0, marginLeft: 'auto' }}
          >
            <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 800, whiteSpace: 'nowrap' }}>
              {ACTIVITY_LABELS[activity]}
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}

export default CapturedPieces
