import { useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import confetti from 'canvas-confetti'
import { motion, useReducedMotion } from 'motion/react'
import { PIECE_IMAGES } from '@/utils/pieces'
import { colorName } from '@/utils/board'
import type { GameOverOverlayProps } from './GameOverOverlay.types'

const WHITE_CONFETTI = ['#f4f6fa', '#f5b942', '#ffe8b3', '#c9d4e8']
const BLACK_CONFETTI = ['#4dd6c1', '#f5b942', '#8ab4ff', '#39404f']

const fireCelebration = (colors: string[]) => {
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
  const sideCannons = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() < end) requestAnimationFrame(sideCannons)
  }
  sideCannons()
}

const GameOverOverlay = ({ status, winner, onRematch, onMenu }: GameOverOverlayProps) => {
  const reduceMotion = useReducedMotion()
  const isCheckmate = status === 'checkmate' && winner !== null
  const title = isCheckmate ? 'CHECKMATE' : status === 'stalemate' ? 'STALEMATE' : 'DRAW'
  const subtitle = isCheckmate ? `${colorName(winner)} wins!` : "Nobody wins. Nobody's mad."

  useEffect(() => {
    if (!isCheckmate || reduceMotion) return
    const timer = setTimeout(
      () => fireCelebration(winner === 'w' ? WHITE_CONFETTI : BLACK_CONFETTI),
      350,
    )
    return () => clearTimeout(timer)
  }, [isCheckmate, winner, reduceMotion])

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
                filter: 'drop-shadow(0 0 32px rgba(245, 185, 66, 0.55))',
              }}
            />
          </motion.div>
        )}
        <Box component="span" sx={{ display: 'flex', overflow: 'hidden', py: 0.5 }}>
          {title.split('').map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 46, rotate: 8 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.25 + index * 0.055, type: 'spring', stiffness: 320, damping: 22 }}
            >
              <Typography
                component="span"
                sx={{
                  fontSize: 'clamp(2.4rem, 9vw, 4.8rem)',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                  background: isCheckmate
                    ? 'linear-gradient(180deg, #ffe8b3 0%, #f5b942 55%, #c98a1b 100%)'
                    : 'linear-gradient(180deg, #eef1f6 0%, #9aa3b5 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
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
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {subtitle}
          </Typography>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
            <Button variant="contained" size="large" onClick={onRematch} sx={{ px: 4 }}>
              Rematch
            </Button>
            <Button variant="outlined" color="inherit" size="large" onClick={onMenu} sx={{ px: 4 }}>
              Main Menu
            </Button>
          </Box>
        </motion.div>
      </Box>
    </motion.div>
  )
}

export default GameOverOverlay
