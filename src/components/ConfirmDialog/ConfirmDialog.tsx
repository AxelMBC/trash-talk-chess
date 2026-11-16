import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
import { STICKER_COLORS } from '@/theme/theme'
import { stickerButtonSx, stickerDialogTitleSx, stickerPanelSx } from '@/theme/sticker'
import type { ConfirmDialogProps } from './ConfirmDialog.types'

const TITLE_ID = 'confirm-dialog-title'
const MESSAGE_ID = 'confirm-dialog-message'

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby={TITLE_ID}
      aria-describedby={MESSAGE_ID}
      slotProps={{ paper: { sx: { px: 3, py: 2.5, maxWidth: 360, ...stickerPanelSx } } }}
    >
      <Typography id={TITLE_ID} variant="h6" sx={{ ...stickerDialogTitleSx, mb: 1 }}>
        {title}
      </Typography>
      <Typography id={MESSAGE_ID} variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mb: 2.5 }}>
        {message}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
        <Button
          variant="contained"
          onClick={onCancel}
          sx={stickerButtonSx(STICKER_COLORS.paper, { size: 'small' })}
        >
          {cancelLabel}
        </Button>
        <Button variant="contained" onClick={onConfirm} sx={stickerButtonSx('primary.main', { size: 'small' })}>
          {confirmLabel}
        </Button>
      </Box>
    </Dialog>
  )
}

export default ConfirmDialog
