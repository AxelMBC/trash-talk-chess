import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { AnimatePresence, motion } from 'motion/react'
import { colorName } from '@/utils/board'
import type { GameStatusBarProps } from './GameStatusBar.types'

const GameStatusBar = ({ turn, status, moveNumber, engineActivity }: GameStatusBarProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2.5,
        py: 1.25,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: turn === 'w' ? '#f4f6fa' : '#1c212c',
            border: '2px solid',
            borderColor: turn === 'w' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)',
            transition: 'background-color 0.3s, border-color 0.3s',
          }}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={turn}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
              {colorName(turn)} to move
            </Typography>
          </motion.div>
        </AnimatePresence>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AnimatePresence>
          {engineActivity && (
            <motion.div
              key={engineActivity}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [1, 0.55, 1], scale: 1 }}
              // Exit must override the infinite pulse, or AnimatePresence
              // never finishes removing the chip.
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.18 } }}
              transition={{
                opacity: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 0.2 },
              }}
            >
              <Chip
                label={engineActivity === 'loading' ? 'Engine warming up…' : 'Thinking…'}
                color="secondary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {status === 'check' && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            >
              <Chip label="Check!" color="error" size="small" sx={{ fontWeight: 800 }} />
            </motion.div>
          )}
        </AnimatePresence>
        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
          Move {moveNumber}
        </Typography>
      </Box>
    </Box>
  )
}

export default GameStatusBar
