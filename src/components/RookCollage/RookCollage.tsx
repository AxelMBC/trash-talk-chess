import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'
import { STICKER_COLORS, STICKER_PALETTE } from '@/theme/theme'
import type { CollageTone, CollageToneColors, RookCollageProps, RookSticker } from './RookCollage.types'

const VIEW_WIDTH = 1600
const VIEW_HEIGHT = 900
const GRID_COLUMNS = 12
const GRID_ROWS = 7
const JITTER_X = 110
const JITTER_Y = 100
const MIN_SCALE = 2.4
const SCALE_RANGE = 2.4
const MAX_TILT_DEGREES = 35
const KNOCKED_OVER_CHANCE = 0.12
const LAYOUT_SEED = 7

const ROOK_SYMBOL_ID = 'rook-collage-rook'
const ROOK_SIZE = 45
const DIE_CUT_WIDTH = 6
const OUTLINE_WIDTH = 1.5
const SHADOW_OFFSET = { x: 6, y: 9 }
const BACKDROP_COLOR = '#1a1410'

const TONES: Record<CollageTone, CollageToneColors> = {
  loud: {
    fills: Object.values(STICKER_PALETTE),
    edge: STICKER_COLORS.paper,
    outline: STICKER_COLORS.ink,
    shadow: STICKER_COLORS.ink,
    shade: { ellipse: '46% 58%', center: 0.78, middle: 0.2, rim: 0.05 },
  },
  quiet: {
    fills: ['#241c15', '#2a2119', '#2d231b', '#30261d'],
    edge: '#3a2f25',
    outline: '#120e0b',
    shadow: '#0d0a08',
    shade: { ellipse: '50% 62%', center: 0.88, middle: 0.45, rim: 0.2 },
  },
}

const rookUseBox = { x: -ROOK_SIZE / 2, y: -ROOK_SIZE / 2, width: ROOK_SIZE, height: ROOK_SIZE }

const createRandom = (seed: number) => {
  let state = seed
  return () => {
    // Numerical Recipes LCG constants.
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

const buildStickers = (): RookSticker[] => {
  const random = createRandom(LAYOUT_SEED)
  const cellWidth = VIEW_WIDTH / GRID_COLUMNS
  const cellHeight = VIEW_HEIGHT / GRID_ROWS
  const placed: (RookSticker & { depth: number })[] = []

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let column = 0; column < GRID_COLUMNS; column++) {
      const isKnockedOver = random() < KNOCKED_OVER_CHANCE
      const x = (column + 0.5) * cellWidth + (random() - 0.5) * JITTER_X
      const y = (row + 0.5) * cellHeight + (random() - 0.5) * JITTER_Y
      const tilt = isKnockedOver
        ? (random() < 0.5 ? -1 : 1) * (80 + random() * 20)
        : (random() * 2 - 1) * MAX_TILT_DEGREES
      const scale = MIN_SCALE + random() * SCALE_RANGE
      const fillPick = random()
      const pose = `rotate(${tilt.toFixed(1)}) scale(${scale.toFixed(2)})`

      placed.push({
        id: `${row}-${column}`,
        fillPick,
        transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) ${pose}`,
        shadowTransform: `translate(${(x + SHADOW_OFFSET.x).toFixed(1)} ${(y + SHADOW_OFFSET.y).toFixed(1)}) ${pose}`,
        depth: random(),
      })
    }
  }

  return placed.sort((a, b) => a.depth - b.depth).map(({ depth: _depth, ...sticker }) => sticker)
}

const STICKERS: readonly RookSticker[] = buildStickers()

const RookCollage = ({ tone = 'loud' }: RookCollageProps) => {
  const { fills, edge, outline, shadow, shade } = TONES[tone]

  return (
    <>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        focusable="false"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <defs>
          {/* Paths copied from src/assets/pieces/wR.svg without fill/stroke so each <use> can recolor them;
              Vite inlines that file as a data: URI, which <use> refuses to reference. */}
          <symbol id={ROOK_SYMBOL_ID} viewBox={`0 0 ${ROOK_SIZE} ${ROOK_SIZE}`}>
            <g fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round">
              <path strokeLinecap="butt" d="M9 39h27v-3H9zm3-3v-4h21v4zm-1-22V9h4v2h5V9h5v2h5V9h4v5" />
              <path d="m34 14-3 3H14l-3-3" />
              <path strokeLinecap="butt" strokeLinejoin="miter" d="M31 17v12.5H14V17" />
              <path d="m31 29.5 1.5 2.5h-20l1.5-2.5" />
              <path fill="none" strokeLinejoin="miter" d="M11 14h23" />
            </g>
          </symbol>
        </defs>
        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill={BACKDROP_COLOR} />
        {STICKERS.map((sticker) => (
          <g key={sticker.id}>
            <use
              href={`#${ROOK_SYMBOL_ID}`}
              {...rookUseBox}
              transform={sticker.shadowTransform}
              fill={shadow}
              stroke={shadow}
              strokeWidth={DIE_CUT_WIDTH}
            />
            <g transform={sticker.transform}>
              <use
                href={`#${ROOK_SYMBOL_ID}`}
                {...rookUseBox}
                fill={edge}
                stroke={edge}
                strokeWidth={DIE_CUT_WIDTH}
              />
              <use
                href={`#${ROOK_SYMBOL_ID}`}
                {...rookUseBox}
                fill={fills[Math.floor(sticker.fillPick * fills.length)]}
                stroke={outline}
                strokeWidth={OUTLINE_WIDTH}
              />
            </g>
          </g>
        ))}
      </svg>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: (theme) => {
            const base = theme.palette.background.default
            return `radial-gradient(ellipse ${shade.ellipse} at 50% 50%, ${alpha(base, shade.center)}, ${alpha(base, shade.middle)} 75%, ${alpha(base, shade.rim)})`
          },
        }}
      />
    </>
  )
}

export default RookCollage
