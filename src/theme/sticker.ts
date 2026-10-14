import { DISPLAY_FONT_FAMILY, STICKER_COLORS } from '@/theme/theme'

export const STICKER_RADIUS = '6px'

export type StickerButtonSize = 'medium' | 'small'
export type SpeechBubbleTail = 'left' | 'up'
export type ResponsiveTail = SpeechBubbleTail | { xs: SpeechBubbleTail; md: SpeechBubbleTail }

const BUTTON_SIZES = {
  medium: { border: 3, shadow: 4 },
  small: { border: 2.5, shadow: 3 },
} as const satisfies Record<StickerButtonSize, { border: number; shadow: number }>

const SPEECH_BUBBLE_BORDER = `2.5px solid ${STICKER_COLORS.ink}`
const BUBBLE_TAIL_SIZE = 14

const BUBBLE_TAILS = {
  up: {
    top: -9,
    left: 'auto',
    right: 28,
    borderTop: SPEECH_BUBBLE_BORDER,
    borderLeft: SPEECH_BUBBLE_BORDER,
    borderBottom: 'none',
  },
  left: {
    top: `calc(50% - ${BUBBLE_TAIL_SIZE / 2}px)`,
    left: -9,
    right: 'auto',
    borderTop: 'none',
    borderLeft: SPEECH_BUBBLE_BORDER,
    borderBottom: SPEECH_BUBBLE_BORDER,
  },
} as const satisfies Record<SpeechBubbleTail, object>

const bubbleTailSx = (tail: ResponsiveTail) => {
  if (typeof tail === 'string') return BUBBLE_TAILS[tail]
  const xs = BUBBLE_TAILS[tail.xs]
  const md = BUBBLE_TAILS[tail.md]
  return {
    top: { xs: xs.top, md: md.top },
    left: { xs: xs.left, md: md.left },
    right: { xs: xs.right, md: md.right },
    borderTop: { xs: xs.borderTop, md: md.borderTop },
    borderLeft: { xs: xs.borderLeft, md: md.borderLeft },
    borderBottom: { xs: xs.borderBottom, md: md.borderBottom },
  }
}

export const hardShadow = (offset: number): string => `${offset}px ${offset}px 0 ${STICKER_COLORS.ink}`

export const focusOutlineSx = {
  '&.Mui-focusVisible': {
    outline: '3px solid',
    outlineColor: 'secondary.main',
    outlineOffset: 3,
  },
}

export const stickerPanelSx = {
  bgcolor: 'background.paper',
  border: `3px solid ${STICKER_COLORS.ink}`,
  borderRadius: STICKER_RADIUS,
  boxShadow: hardShadow(8),
}

export const posterTextSx = {
  fontFamily: DISPLAY_FONT_FAMILY,
  fontWeight: 400,
  color: STICKER_COLORS.paper,
  WebkitTextStroke: `3px ${STICKER_COLORS.ink}`,
  paintOrder: 'stroke fill',
  textShadow: hardShadow(6),
}

export const smallPosterTextSx = {
  ...posterTextSx,
  WebkitTextStroke: `2px ${STICKER_COLORS.ink}`,
  textShadow: hardShadow(4),
}

export const labelStickerSx = (background: string, shadowOffset: number) => ({
  fontFamily: DISPLAY_FONT_FAMILY,
  color: STICKER_COLORS.ink,
  bgcolor: background,
  border: `3px solid ${STICKER_COLORS.ink}`,
  boxShadow: hardShadow(shadowOffset),
})

export const stickerButtonSx = (background: string, { size = 'medium' }: { size?: StickerButtonSize } = {}) => {
  const { border, shadow } = BUTTON_SIZES[size]
  return {
    '&.Mui-focusVisible': { ...focusOutlineSx['&.Mui-focusVisible'], boxShadow: hardShadow(shadow) },
    ...(size === 'medium' ? { height: '100%' } : { minWidth: 0, px: 1.5, py: 0.375, fontSize: '0.9rem' }),
    fontWeight: 800,
    bgcolor: background,
    color: STICKER_COLORS.ink,
    border: `${border}px solid ${STICKER_COLORS.ink}`,
    borderRadius: STICKER_RADIUS,
    boxShadow: hardShadow(shadow),
    transition: 'transform 80ms, box-shadow 80ms',
    '&:hover': { bgcolor: background, transform: 'translate(-1px, -1px)', boxShadow: hardShadow(shadow + 1) },
    '&:active': { transform: `translate(${shadow}px, ${shadow}px)`, boxShadow: hardShadow(0) },
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
  }
}

export const speechBubbleSx = (tail: ResponsiveTail) =>
  ({
    position: 'relative',
    bgcolor: STICKER_COLORS.paper,
    color: STICKER_COLORS.ink,
    fontWeight: 800,
    fontSize: '0.86rem',
    lineHeight: 1.2,
    px: 1.5,
    py: 1.125,
    border: SPEECH_BUBBLE_BORDER,
    borderRadius: '12px',
    boxShadow: hardShadow(4),
    '&::after': {
      content: '""',
      position: 'absolute',
      width: BUBBLE_TAIL_SIZE,
      height: BUBBLE_TAIL_SIZE,
      bgcolor: STICKER_COLORS.paper,
      transform: 'rotate(45deg)',
      ...bubbleTailSx(tail),
    },
  }) as const
