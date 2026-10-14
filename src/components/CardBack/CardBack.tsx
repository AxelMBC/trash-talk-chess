import Box from '@mui/material/Box'
import { DISPLAY_FONT_FAMILY, STICKER_COLORS } from '@/theme/theme'
import { hardShadow } from '@/theme/sticker'
import { CARD_FACE_SX } from '@/theme/card'
import { PIECE_IMAGES } from '@/utils/pieces'

const ROOK_MARK_SIZE = 120

const CardBack = () => (
  <Box
    aria-hidden
    sx={{
      ...CARD_FACE_SX,
      height: '100%',
      bgcolor: 'primary.main',
      display: 'grid',
      placeItems: 'center',
    }}
  >
    <Box sx={{ display: 'grid', justifyItems: 'center', gap: 0.75 }}>
      <Box
        component="img"
        src={PIECE_IMAGES.w.r}
        alt=""
        sx={{ width: ROOK_MARK_SIZE, filter: `drop-shadow(${hardShadow(4)})` }}
      />
      <Box
        component="span"
        sx={{
          fontFamily: DISPLAY_FONT_FAMILY,
          fontSize: '1.25rem',
          lineHeight: 1,
          letterSpacing: '0.1em',
          color: STICKER_COLORS.ink,
          bgcolor: STICKER_COLORS.paper,
          border: `2.5px solid ${STICKER_COLORS.ink}`,
          px: 1.25,
          pt: 0.5,
          pb: 0.625,
          transform: 'rotate(-3deg)',
        }}
      >
        TRASH TALK CHESS
      </Box>
    </Box>
  </Box>
)

export default CardBack
