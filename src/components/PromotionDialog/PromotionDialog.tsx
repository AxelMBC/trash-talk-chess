import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
import { motion } from 'motion/react'
import { DISPLAY_FONT_FAMILY, STICKER_COLORS } from '@/theme/theme'
import { stickerButtonSx, stickerPanelSx } from '@/theme/sticker'
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
            ...stickerPanelSx,
          },
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          textAlign: 'center',
          fontFamily: DISPLAY_FONT_FAMILY,
          fontWeight: 400,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          mb: 2,
        }}
      >
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
                  ...stickerButtonSx(STICKER_COLORS.paper),
                  width: { xs: 64, sm: 84 },
                  height: { xs: 64, sm: 84 },
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
