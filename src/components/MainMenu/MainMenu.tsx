import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import RookCollage from '@/components/RookCollage'
import { DISPLAY_FONT_FAMILY, STICKER_COLORS } from '@/theme/theme'
import { PIECE_IMAGES } from '@/utils/pieces'
import type { Difficulty } from '@/types/chess.types'
import type { ComputerEntry, MainMenuProps } from './MainMenu.types'

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const MENU_PANEL_WIDTH = 400
const MODE_BUTTON_HEIGHT = 60
const STICKER_RADIUS = '6px'
const COMPUTER_TAUNT = 'Bold of you to show up.'

const titleSpring = { type: 'spring', stiffness: 520, damping: 22 } as const

const hardShadow = (offset: number) => `${offset}px ${offset}px 0 ${STICKER_COLORS.ink}`

const focusOutlineSx = {
  '&.Mui-focusVisible': {
    outline: '3px solid',
    outlineColor: 'secondary.main',
    outlineOffset: 3,
  },
}

const stickerButtonSx = (background: string) => ({
  '&.Mui-focusVisible': { ...focusOutlineSx['&.Mui-focusVisible'], boxShadow: hardShadow(4) },
  height: '100%',
  fontWeight: 800,
  bgcolor: background,
  color: STICKER_COLORS.ink,
  border: `3px solid ${STICKER_COLORS.ink}`,
  borderRadius: STICKER_RADIUS,
  boxShadow: hardShadow(4),
  transition: 'transform 80ms, box-shadow 80ms',
  '&:hover': { bgcolor: background, transform: 'translate(-1px, -1px)', boxShadow: hardShadow(5) },
  '&:active': { transform: 'translate(4px, 4px)', boxShadow: hardShadow(0) },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
})

const modeButtonSx = { fontSize: '1.15rem' }

const tauntBubbleSx = {
  position: 'absolute',
  zIndex: 1,
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  bgcolor: STICKER_COLORS.paper,
  color: STICKER_COLORS.ink,
  fontWeight: 800,
  fontSize: '0.86rem',
  lineHeight: 1.2,
  px: 1.5,
  py: 1.125,
  border: `2.5px solid ${STICKER_COLORS.ink}`,
  borderRadius: '12px',
  boxShadow: hardShadow(4),
  top: { xs: 'calc(100% + 16px)', md: '50%' },
  right: { xs: 8, md: 'auto' },
  left: { md: 'calc(100% + 44px)' },
  transform: { xs: 'rotate(-3deg)', md: 'translateY(-50%) rotate(4deg)' },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: 14,
    height: 14,
    bgcolor: STICKER_COLORS.paper,
    borderLeft: `2.5px solid ${STICKER_COLORS.ink}`,
    transform: 'rotate(45deg)',
    top: { xs: -9, md: 'calc(50% - 7px)' },
    right: { xs: 28, md: 'auto' },
    left: { md: -9 },
    borderTop: { xs: `2.5px solid ${STICKER_COLORS.ink}`, md: 'none' },
    borderBottom: { md: `2.5px solid ${STICKER_COLORS.ink}` },
  },
} as const

const MainMenu = ({ onPlayLocal, onPlayComputer, onScout }: MainMenuProps) => {
  const reduceMotion = useReducedMotion()
  const [username, setUsername] = useState('')
  const [computerEntry, setComputerEntry] = useState<ComputerEntry>('closed')
  const isPickingLevel = computerEntry === 'picking'
  const entryTransition = { duration: reduceMotion ? 0 : 0.16 }
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
        px: 2,
        py: 6,
      }}
    >
      <RookCollage />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: (theme) => {
            const shade = theme.palette.background.default
            return `radial-gradient(ellipse 46% 58% at 50% 50%, ${alpha(shade, 0.78)}, ${alpha(shade, 0.2)} 75%, ${alpha(shade, 0.05)})`
          },
        }}
      />

      <Typography
        variant="h1"
        sx={{
          position: 'relative',
          display: 'grid',
          justifyItems: 'center',
          mb: 3.25,
          fontFamily: DISPLAY_FONT_FAMILY,
          fontWeight: 400,
          textAlign: 'center',
        }}
      >
        <motion.span
          initial={reduceMotion ? false : { scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={titleSpring}
          style={{ display: 'block', rotate: -3 }}
        >
          <Box
            component="span"
            sx={{
              display: 'block',
              fontSize: 'clamp(3rem, 11vw, 7.2rem)',
              lineHeight: 0.9,
              letterSpacing: '0.01em',
              color: STICKER_COLORS.paper,
              WebkitTextStroke: `3px ${STICKER_COLORS.ink}`,
              paintOrder: 'stroke fill',
              textShadow: hardShadow(6),
            }}
          >
            TRASH TALK
          </Box>
        </motion.span>
        <motion.span
          initial={reduceMotion ? false : { rotate: -14, scale: 1.5, opacity: 0 }}
          animate={{ rotate: 2, scale: 1, opacity: 1 }}
          transition={{ ...titleSpring, delay: 0.25 }}
          style={{ display: 'block', y: -6 }}
        >
          <Box
            component="span"
            sx={{
              display: 'block',
              fontSize: 'clamp(2.2rem, 7.5vw, 4.6rem)',
              lineHeight: 1,
              letterSpacing: '0.18em',
              color: STICKER_COLORS.ink,
              bgcolor: 'primary.main',
              px: 2.75,
              pt: 0.25,
              pb: 0.75,
              border: `3px solid ${STICKER_COLORS.ink}`,
              boxShadow: hardShadow(6),
            }}
          >
            CHESS
          </Box>
        </motion.span>
      </Typography>

      <motion.div
        initial={reduceMotion ? false : { y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 26, delay: 0.45 }}
        style={{ position: 'relative', width: '100%', maxWidth: MENU_PANEL_WIDTH }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 1.75,
            bgcolor: 'background.paper',
            border: `3px solid ${STICKER_COLORS.ink}`,
            borderRadius: STICKER_RADIUS,
            boxShadow: hardShadow(8),
            px: { xs: 2, sm: 2.5 },
            pt: 2.75,
            pb: 2.25,
          }}
        >
          <Box sx={{ height: MODE_BUTTON_HEIGHT }}>
            <Button
              variant="contained"
              fullWidth
              onClick={onPlayLocal}
              startIcon={
                <img src={PIECE_IMAGES.b.n} alt="" aria-hidden style={{ width: 30, height: 30 }} />
              }
              sx={{ ...stickerButtonSx('primary.main'), ...modeButtonSx }}
            >
              Local
            </Button>
          </Box>

          <Box sx={{ position: 'relative', height: MODE_BUTTON_HEIGHT }}>
            <AnimatePresence mode="wait" initial={false}>
              {isPickingLevel ? (
                <motion.div
                  key="levels"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={entryTransition}
                  style={{ height: '100%' }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    role="group"
                    aria-label="computer difficulty"
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setComputerEntry('dismissed')
                    }}
                    sx={{ height: '100%' }}
                  >
                    <Button
                      variant="contained"
                      aria-label="Back to game modes"
                      onClick={() => setComputerEntry('dismissed')}
                      sx={{ ...stickerButtonSx(STICKER_COLORS.paper), minWidth: 0, px: { xs: 1.5, sm: 2 }, fontSize: '1.15rem' }}
                    >
                      ←
                    </Button>
                    {DIFFICULTIES.map(({ value, label }, index) => (
                      <Button
                        key={value}
                        variant="contained"
                        autoFocus={index === 0}
                        onClick={() => onPlayComputer(value)}
                        sx={{
                          ...stickerButtonSx(STICKER_COLORS.paper),
                          flex: 1,
                          minWidth: 0,
                          px: 1,
                          fontSize: { xs: '0.95rem', sm: '1.05rem' },
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </Stack>
                </motion.div>
              ) : (
                <motion.div
                  key="mode"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={entryTransition}
                  style={{ height: '100%' }}
                >
                  <Button
                    variant="contained"
                    fullWidth
                    autoFocus={computerEntry === 'dismissed'}
                    onClick={() => setComputerEntry('picking')}
                    startIcon={
                      <img src={PIECE_IMAGES.w.n} alt="" aria-hidden style={{ width: 30, height: 30 }} />
                    }
                    sx={{ ...stickerButtonSx(STICKER_COLORS.paper), ...modeButtonSx }}
                  >
                    vs Computer
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <Box sx={tauntBubbleSx}>
              {COMPUTER_TAUNT}
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ mt: { xs: 7, md: 0.5 } }}>
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
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.default', borderRadius: STICKER_RADIUS } }}
            />
            <Button
              variant="outlined"
              color="secondary"
              onClick={submitScout}
              disabled={!trimmedUsername}
              sx={{ ...focusOutlineSx, px: 3, flexShrink: 0, borderWidth: 2, borderRadius: STICKER_RADIUS }}
            >
              Scout
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.45 }}>
            Pass &amp; play on one device, battle the computer — or scout a chess.com profile for the roast of a
            lifetime
          </Typography>
        </Box>
      </motion.div>
    </Box>
  )
}

export default MainMenu
