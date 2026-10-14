import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { Color } from 'chess.js'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { DISPLAY_FONT_FAMILY, STICKER_COLORS } from '@/theme/theme'
import { STICKER_RADIUS, hardShadow, stickerButtonSx } from '@/theme/sticker'
import { colorName } from '@/utils/board'
import type { GameStatusBarProps, TurnPerspective } from './GameStatusBar.types'

const LABEL_TILT_DEGREES = -2
const slapSpring = { type: 'spring', stiffness: 600, damping: 20 } as const

const turnLabel = (turn: Color, perspective: TurnPerspective): string => {
  if (perspective.mode === 'local') return `${colorName(turn)} to move`
  return turn === perspective.playerColor ? 'Your move' : `${perspective.engineName}'s move`
}

const GameStatusBar = ({ turn, status, moveNumber, perspective, onExitToMenu }: GameStatusBarProps) => {
  const reduceMotion = useReducedMotion()
  const isWhiteToMove = turn === 'w'

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Button
        variant="contained"
        onClick={onExitToMenu}
        sx={{ ...stickerButtonSx(STICKER_COLORS.paper, { size: 'small' }), justifySelf: 'start' }}
      >
        ← Menu
      </Button>

      <Box sx={{ position: 'relative' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={turn}
            initial={reduceMotion ? false : { scale: 1.35, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: LABEL_TILT_DEGREES, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            transition={slapSpring}
          >
            <Typography
              component="span"
              sx={{
                display: 'block',
                px: 1.5,
                pt: 0.25,
                pb: 0.375,
                fontFamily: DISPLAY_FONT_FAMILY,
                fontSize: { xs: '1rem', sm: '1.2rem' },
                lineHeight: 1.2,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                bgcolor: isWhiteToMove ? STICKER_COLORS.paper : STICKER_COLORS.ink,
                color: isWhiteToMove ? STICKER_COLORS.ink : STICKER_COLORS.paper,
                border: `2.5px solid ${isWhiteToMove ? STICKER_COLORS.ink : STICKER_COLORS.paper}`,
                borderRadius: STICKER_RADIUS,
                boxShadow: hardShadow(3),
              }}
            >
              {turnLabel(turn, perspective)}
            </Typography>
          </motion.div>
        </AnimatePresence>
        <AnimatePresence>
          {status === 'check' && (
            <motion.div
              initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              style={{ position: 'absolute', top: -12, right: -16, rotate: 8 }}
            >
              <Typography
                component="span"
                sx={{
                  display: 'block',
                  px: 0.75,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  lineHeight: 1.5,
                  whiteSpace: 'nowrap',
                  bgcolor: 'error.main',
                  color: STICKER_COLORS.paper,
                  border: `2px solid ${STICKER_COLORS.ink}`,
                  borderRadius: STICKER_RADIUS,
                  boxShadow: hardShadow(2),
                }}
              >
                Check!
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      <Typography
        variant="body2"
        sx={{ justifySelf: 'end', color: 'text.secondary', fontWeight: 700, whiteSpace: 'nowrap' }}
      >
        Move {moveNumber}
      </Typography>
    </Box>
  )
}

export default GameStatusBar
