import { Fragment, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'
import type { Move } from 'chess.js'
import { useReducedMotion } from 'motion/react'
import { STICKER_COLORS } from '@/theme/theme'
import { STICKER_RADIUS, focusOutlineSx, stickerButtonSx, stickerPlateSx } from '@/theme/sticker'
import type { MoveListProps } from './MoveList.types'

const COLUMN = 'lg'
const COLUMN_WIDTH_PX = 216
const COLUMN_GAP_PX = 24
const STRIP_HEIGHT_PX = 44
const SCROLL_MARGIN_PX = 8

interface MoveRow {
  number: number
  white: Move
  black: Move | undefined
}

const toRows = (moves: Move[]): MoveRow[] => {
  const rows: MoveRow[] = []
  for (let index = 0; index < moves.length; index += 2) {
    rows.push({ number: index / 2 + 1, white: moves[index], black: moves[index + 1] })
  }
  return rows
}

const overflowBeyond = (start: number, end: number, frameStart: number, frameEnd: number): number => {
  if (start < frameStart + SCROLL_MARGIN_PX) return start - frameStart - SCROLL_MARGIN_PX
  if (end > frameEnd - SCROLL_MARGIN_PX) return end - frameEnd + SCROLL_MARGIN_PX
  return 0
}

const stepButtonSx = (background: string) => ({
  ...stickerButtonSx(background, { size: 'small' }),
  px: 1,
  py: 0,
  lineHeight: 1.6,
})

const MoveList = ({ moves, viewPly, isLive, disabled, onViewMove, onStepView, onViewLive }: MoveListProps) => {
  const reduceMotion = useReducedMotion()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const markedRef = useRef<HTMLButtonElement>(null)
  const cannotGoBack = disabled || viewPly === 0
  const cannotGoForward = disabled || isLive

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const behavior = reduceMotion ? 'instant' : 'smooth'
    const marked = markedRef.current
    if (!marked) {
      scroller.scrollTo({ left: 0, top: 0, behavior })
      return
    }
    const frame = scroller.getBoundingClientRect()
    const target = marked.getBoundingClientRect()
    scroller.scrollBy({
      left: overflowBeyond(target.left, target.right, frame.left, frame.right),
      top: overflowBeyond(target.top, target.bottom, frame.top, frame.bottom),
      behavior,
    })
  }, [viewPly, reduceMotion])

  const renderMove = (move: Move, ply: number) => {
    const isMarked = ply === viewPly
    return (
      <ButtonBase
        ref={isMarked ? markedRef : undefined}
        disabled={disabled}
        aria-current={isMarked ? 'step' : undefined}
        onClick={() => onViewMove(ply)}
        sx={{
          '&.Mui-focusVisible': { ...focusOutlineSx['&.Mui-focusVisible'], outlineOffset: -3 },
          justifyContent: 'flex-start',
          flexShrink: 0,
          px: 0.75,
          py: 0.25,
          borderRadius: STICKER_RADIUS,
          fontSize: '0.85rem',
          fontWeight: 800,
          whiteSpace: 'nowrap',
          bgcolor: isMarked ? 'primary.main' : 'transparent',
          color: isMarked ? 'primary.contrastText' : 'text.primary',
        }}
      >
        {move.san}
      </ButtonBase>
    )
  }

  return (
    <Box
      component="nav"
      aria-label="Moves"
      sx={{
        display: 'flex',
        flexDirection: { xs: 'row', [COLUMN]: 'column' },
        alignItems: { xs: 'center', [COLUMN]: 'stretch' },
        gap: 1,
        height: { xs: STRIP_HEIGHT_PX, [COLUMN]: 'auto' },
        p: { xs: 0, [COLUMN]: 1 },
        pl: { xs: 0.5, [COLUMN]: 1 },
        pr: 1,
        ...stickerPlateSx,
        position: { [COLUMN]: 'absolute' },
        top: { [COLUMN]: 0 },
        bottom: { [COLUMN]: 0 },
        left: { [COLUMN]: `calc(100% + ${COLUMN_GAP_PX}px)` },
        width: { [COLUMN]: COLUMN_WIDTH_PX },
      }}
    >
      <Box
        ref={scrollerRef}
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: { xs: 'flex', [COLUMN]: 'grid' },
          gridTemplateColumns: 'auto 1fr 1fr',
          alignItems: 'center',
          alignContent: 'start',
          columnGap: 0.25,
          rowGap: 0.25,
          overflowX: { xs: 'auto', [COLUMN]: 'hidden' },
          overflowY: { xs: 'hidden', [COLUMN]: 'auto' },
          scrollbarWidth: { xs: 'none', [COLUMN]: 'thin' },
        }}
      >
        {toRows(moves).map((row) => (
          <Fragment key={row.number}>
            <Typography
              component="span"
              sx={{
                flexShrink: 0,
                pl: { xs: 1, [COLUMN]: 0 },
                pr: 0.25,
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'text.secondary',
              }}
            >
              {row.number}.
            </Typography>
            {renderMove(row.white, row.number * 2 - 1)}
            {row.black && renderMove(row.black, row.number * 2)}
          </Fragment>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexShrink: 0, justifyContent: 'center', gap: 0.75, pb: '3px' }}>
        <Button
          variant="contained"
          aria-label="Go to the start"
          disabled={cannotGoBack}
          onClick={() => onViewMove(0)}
          sx={stepButtonSx(STICKER_COLORS.paper)}
        >
          «
        </Button>
        <Button
          variant="contained"
          aria-label="Previous move"
          disabled={cannotGoBack}
          onClick={() => onStepView(-1)}
          sx={stepButtonSx(STICKER_COLORS.paper)}
        >
          ‹
        </Button>
        <Button
          variant="contained"
          aria-label="Next move"
          disabled={cannotGoForward}
          onClick={() => onStepView(1)}
          sx={stepButtonSx(STICKER_COLORS.paper)}
        >
          ›
        </Button>
        <Button
          variant="contained"
          aria-label="Back to the live position"
          disabled={cannotGoForward}
          onClick={onViewLive}
          sx={stepButtonSx(isLive ? STICKER_COLORS.paper : 'primary.main')}
        >
          »
        </Button>
      </Box>
    </Box>
  )
}

export default MoveList
