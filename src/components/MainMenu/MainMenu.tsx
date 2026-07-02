import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { motion, useReducedMotion } from 'motion/react'
import { PIECE_IMAGES } from '@/utils/pieces'
import type { FloatingPieceConfig, MainMenuProps } from './MainMenu.types'

const FLOATING_PIECES: FloatingPieceConfig[] = [
  { image: PIECE_IMAGES.w.n, size: 110, top: '12%', left: '8%', duration: 7, delay: 0, opacity: 0.1 },
  { image: PIECE_IMAGES.b.q, size: 150, top: '62%', left: '80%', duration: 9, delay: 0.8, opacity: 0.1 },
  { image: PIECE_IMAGES.w.r, size: 90, top: '72%', left: '12%', duration: 8, delay: 1.6, opacity: 0.09 },
  { image: PIECE_IMAGES.b.b, size: 120, top: '16%', left: '78%', duration: 10, delay: 0.4, opacity: 0.09 },
  { image: PIECE_IMAGES.w.k, size: 100, top: '40%', left: '90%', duration: 7.5, delay: 1.2, opacity: 0.07 },
  { image: PIECE_IMAGES.b.p, size: 70, top: '48%', left: '4%', duration: 6.5, delay: 2, opacity: 0.08 },
]

const MainMenu = ({ onPlayLocal, onScout }: MainMenuProps) => {
  const reduceMotion = useReducedMotion()
  const [username, setUsername] = useState('')
  const trimmedUsername = username.trim()

  const submitScout = () => {
    if (trimmedUsername) onScout(trimmedUsername)
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background:
          'radial-gradient(1100px 640px at 50% -10%, rgba(245, 185, 66, 0.14), transparent 60%), radial-gradient(900px 600px at 85% 110%, rgba(77, 214, 193, 0.1), transparent 60%), #0b0e14',
        px: 3,
      }}
    >
      {FLOATING_PIECES.map((piece, index) => (
        <motion.img
          key={index}
          src={piece.image}
          alt=""
          aria-hidden
          animate={reduceMotion ? undefined : { y: [0, -22, 0], rotate: [0, index % 2 === 0 ? 6 : -6, 0] }}
          transition={{ duration: piece.duration, delay: piece.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: piece.top,
            left: piece.left,
            width: piece.size,
            opacity: piece.opacity,
            filter: 'blur(1px)',
            pointerEvents: 'none',
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ textAlign: 'center' }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: 'clamp(2.8rem, 10vw, 6rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(180deg, #ffffff 0%, #dfe6f2 45%, #8e99ad 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          TRASH TALK
        </Typography>
        <Typography
          variant="h1"
          sx={{
            fontSize: 'clamp(2.8rem, 10vw, 6rem)',
            lineHeight: 1.02,
            letterSpacing: '0.14em',
            background: 'linear-gradient(180deg, #ffe8b3 0%, #f5b942 55%, #c98a1b 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          CHESS
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.6 }}
      >
        <Typography
          sx={{ mt: 2.5, color: 'text.secondary', fontWeight: 600, textAlign: 'center' }}
        >
          Talk is cheap. Your moves shouldn't be.
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        style={{ marginTop: 44 }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={onPlayLocal}
          startIcon={
            <img src={PIECE_IMAGES.b.n} alt="" aria-hidden style={{ width: 30, height: 30 }} />
          }
          sx={{
            px: 6,
            py: 1.75,
            fontSize: '1.15rem',
            boxShadow: '0 10px 34px rgba(245, 185, 66, 0.35)',
          }}
        >
          Local
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        style={{ marginTop: 28, width: '100%', maxWidth: 380 }}
      >
        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            placeholder="chess.com username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitScout()
            }}
            slotProps={{ htmlInput: { 'aria-label': 'chess.com username' } }}
          />
          <Button
            variant="outlined"
            color="secondary"
            onClick={submitScout}
            disabled={!trimmedUsername}
            sx={{ px: 3, flexShrink: 0 }}
          >
            Scout
          </Button>
        </Stack>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <Typography variant="caption" sx={{ mt: 3, display: 'block', color: 'text.secondary' }}>
          Pass &amp; play on one device — or scout a chess.com profile for the roast of a lifetime
        </Typography>
      </motion.div>
    </Box>
  )
}

export default MainMenu
