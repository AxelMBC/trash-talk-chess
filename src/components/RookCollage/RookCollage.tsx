import theme, { BOARD_COLORS, STICKER_COLORS } from '@/theme/theme'
import type { RookSticker } from './RookCollage.types'

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

const PALETTE = [
  theme.palette.primary.main,
  theme.palette.secondary.main,
  BOARD_COLORS.lightSquare,
  '#ff4f9a',
  '#ff5a36',
  '#3d7bff',
  '#b6e34a',
  '#1b1f2a',
] as const

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
      const color = PALETTE[Math.floor(random() * PALETTE.length)]
      const pose = `rotate(${tilt.toFixed(1)}) scale(${scale.toFixed(2)})`

      placed.push({
        id: `${row}-${column}`,
        color,
        transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) ${pose}`,
        shadowTransform: `translate(${(x + SHADOW_OFFSET.x).toFixed(1)} ${(y + SHADOW_OFFSET.y).toFixed(1)}) ${pose}`,
        depth: random(),
      })
    }
  }

  return placed.sort((a, b) => a.depth - b.depth).map(({ depth: _depth, ...sticker }) => sticker)
}

const STICKERS: readonly RookSticker[] = buildStickers()

const RookCollage = () => (
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
          fill={STICKER_COLORS.ink}
          stroke={STICKER_COLORS.ink}
          strokeWidth={DIE_CUT_WIDTH}
        />
        <g transform={sticker.transform}>
          <use
            href={`#${ROOK_SYMBOL_ID}`}
            {...rookUseBox}
            fill={STICKER_COLORS.paper}
            stroke={STICKER_COLORS.paper}
            strokeWidth={DIE_CUT_WIDTH}
          />
          <use
            href={`#${ROOK_SYMBOL_ID}`}
            {...rookUseBox}
            fill={sticker.color}
            stroke={STICKER_COLORS.ink}
            strokeWidth={OUTLINE_WIDTH}
          />
        </g>
      </g>
    ))}
  </svg>
)

export default RookCollage
