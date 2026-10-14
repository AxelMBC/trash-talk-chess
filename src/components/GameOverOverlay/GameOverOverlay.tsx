import { useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import confetti from 'canvas-confetti'
import { motion, useReducedMotion } from 'motion/react'
import { STICKER_COLORS, STICKER_PALETTE } from '@/theme/theme'
import { hardShadow, labelStickerSx, posterTextSx, stickerButtonSx } from '@/theme/sticker'
import { PIECE_IMAGES } from '@/utils/pieces'
import { colorName } from '@/utils/board'
import type { GameOverOverlayProps } from './GameOverOverlay.types'

const { ink: _ink, ...confettiPalette } = STICKER_PALETTE
const CONFETTI_COLORS: string[] = Object.values(confettiPalette)

const overlayButtonSx = { px: 4, py: 1, fontSize: '1.05rem' }

const fireCelebration = (colors: string[]): (() => void) => {
  const burst = (particleRatio: number, options: confetti.Options) => {
    confetti({
      particleCount: Math.floor(240 * particleRatio),
      spread: 70,
      origin: { y: 0.6 },
      colors,
      ...options,
    })
  }
  burst(0.3, { spread: 30, startVelocity: 55 })
  burst(0.25, { spread: 60 })
  burst(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
  burst(0.15, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })

  const end = Date.now() + 1800
  let frame = 0
  const sideCannons = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() < end) frame = requestAnimationFrame(sideCannons)
  }
  sideCannons()

  return () => {
    cancelAnimationFrame(frame)
    confetti.reset()
  }
}

const GameOverOverlay = ({ status, winner, onRematch, onMenu }: GameOverOverlayProps) => {
  const reduceMotion = useReducedMotion()
  const isCheckmate = status === 'checkmate' && winner !== null
  const title = isCheckmate ? 'CHECKMATE' : status === 'stalemate' ? 'STALEMATE' : 'DRAW'
  const subtitle = isCheckmate ? `${colorName(winner)} wins!` : "Nobody wins. Nobody's mad."

  useEffect(() => {
    if (!isCheckmate || reduceMotion) return
    let stopCelebration: (() => void) | undefined
    const timer = setTimeout(() => {
      stopCelebration = fireCelebration(CONFETTI_COLORS)
    }, 350)
    return () => {
      clearTimeout(timer)
      stopCelebration?.()
    }
  }, [isCheckmate, reduceMotion])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 10, 16, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, px: 3 }}>
        {isCheckmate && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 16 }}
          >
            <img
              src={PIECE_IMAGES[winner]['k']}
              alt={`${colorName(winner)} King`}
              style={{
                width: 'clamp(88px, 18vw, 140px)',
                filter: `drop-shadow(${hardShadow(6)})`,
              }}
            />
          </motion.div>
        )}
        <Box component="span" sx={{ display: 'flex', overflow: 'hidden', pt: 0.5, pb: 1.5, pr: 1 }}>
          {title.split('').map((letter, index) => (
            <motion.span
              // Letters repeat and the title never reorders, so position is the identity.
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              initial={{ opacity: 0, y: 46, rotate: 8 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.25 + index * 0.055, type: 'spring', stiffness: 320, damping: 22 }}
            >
              <Typography
                component="span"
                sx={{
                  display: 'block',
                  fontSize: 'clamp(2.6rem, 10vw, 5.4rem)',
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                  ...posterTextSx,
                }}
              >
                {letter}
              </Typography>
            </motion.span>
          ))}
        </Box>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
        >
          <Typography
            sx={{
              fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              ...labelStickerSx('primary.main', 4),
              px: 2,
              py: 0.25,
              transform: 'rotate(-2deg)',
            }}
          >
            {subtitle}
          </Typography>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
            <Button
              variant="contained"
              onClick={onRematch}
              sx={{ ...stickerButtonSx('primary.main'), ...overlayButtonSx }}
            >
              Rematch
            </Button>
            <Button
              variant="contained"
              onClick={onMenu}
              sx={{ ...stickerButtonSx(STICKER_COLORS.paper), ...overlayButtonSx }}
            >
              Main Menu
            </Button>
          </Box>
        </motion.div>
      </Box>
    </motion.div>
  )
}

export default GameOverOverlay
