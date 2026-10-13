import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { motion } from 'motion/react'
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
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        The engine flipped the table
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        {message ?? 'The chess engine ran into a problem.'}
      </Typography>
      <Button variant="contained" onClick={onMenu}>
        ← Back to menu
      </Button>
    </Box>
  </motion.div>
)

export default EngineErrorOverlay
