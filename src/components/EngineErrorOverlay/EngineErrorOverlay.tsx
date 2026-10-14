import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { motion } from 'motion/react'
import { DISPLAY_FONT_FAMILY } from '@/theme/theme'
import { stickerButtonSx, stickerPanelSx } from '@/theme/sticker'
import type { EngineErrorOverlayProps } from './EngineErrorOverlay.types'

const EngineErrorOverlay = ({ message, onMenu }: EngineErrorOverlayProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(11, 14, 20, 0.82)',
      backdropFilter: 'blur(6px)',
    }}
  >
    <Box
      sx={{
        maxWidth: 420,
        mx: 2,
        px: 4,
        py: 3.5,
        textAlign: 'center',
        ...stickerPanelSx,
      }}
    >
      <Typography
        variant="h5"
        sx={{ fontFamily: DISPLAY_FONT_FAMILY, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', mb: 1 }}
      >
        The engine flipped the table
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        {message ?? 'The chess engine ran into a problem.'}
      </Typography>
      <Button variant="contained" onClick={onMenu} sx={{ ...stickerButtonSx('primary.main'), px: 3, py: 1 }}>
        ← Back to menu
      </Button>
    </Box>
  </motion.div>
)

export default EngineErrorOverlay
