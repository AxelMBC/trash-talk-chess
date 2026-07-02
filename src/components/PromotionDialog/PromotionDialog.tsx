import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
import { motion } from 'motion/react'
import { PIECE_IMAGES, PIECE_NAMES } from '@/utils/pieces'
import type { PromotionPiece } from '@/types/chess.types'
import type { PromotionDialogProps } from './PromotionDialog.types'

const PROMOTION_PIECES: PromotionPiece[] = ['q', 'r', 'b', 'n']

const PromotionDialog = ({ promotion, onSelect, onCancel }: PromotionDialogProps) => {
  return (
    <Dialog
      open={promotion !== null}
      onClose={onCancel}
      slotProps={{
        paper: {
          sx: {
            px: 3,
            py: 2.5,
            borderRadius: 4,
            backgroundColor: 'rgba(20, 25, 38, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
          },
        },
      }}
    >
      <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 800, mb: 2 }}>
        Promote to
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {promotion !== null &&
          PROMOTION_PIECES.map((piece, index) => (
            <motion.div
              key={piece}
              initial={{ opacity: 0, y: 16, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.06, type: 'spring', stiffness: 420, damping: 26 }}
            >
              <ButtonBase
                onClick={() => onSelect(piece)}
                aria-label={`Promote to ${PIECE_NAMES[piece]}`}
                sx={{
                  width: { xs: 64, sm: 84 },
                  height: { xs: 64, sm: 84 },
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  transition: 'background-color 0.15s, transform 0.15s',
                  '&:hover': {
                    backgroundColor: 'rgba(245, 185, 66, 0.18)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <img
                  src={PIECE_IMAGES[promotion.color][piece]}
                  alt={PIECE_NAMES[piece]}
                  style={{ width: '82%', height: '82%' }}
                />
              </ButtonBase>
            </motion.div>
          ))}
      </Box>
    </Dialog>
  )
}

export default PromotionDialog
