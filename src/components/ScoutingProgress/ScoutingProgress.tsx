import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { darken, keyframes } from '@mui/material/styles'
import { motion, useReducedMotion } from 'motion/react'
import CardBack from '@/components/CardBack'
import { STICKER_COLORS, STICKER_PALETTE } from '@/theme/theme'
import { STICKER_RADIUS, hardShadow, smallPosterTextSx } from '@/theme/sticker'
import { CARD_ASPECT_RATIO } from '@/theme/card'
import type { ScoutingStage } from '@/hooks/useScoutingReport'
import type { ScoutingProgressProps } from './ScoutingProgress.types'

type StepStatus = 'done' | 'now' | 'waiting'

const INK = STICKER_COLORS.ink
const STRIPE_TILE = 28

const STEPS: readonly { stage: ScoutingStage; label: string }[] = [
  { stage: 'profile', label: 'Profile found' },
  { stage: 'ratings', label: 'Ratings pulled' },
  { stage: 'games', label: 'Digging through games' },
]

const STATUS_MARKS = {
  done: { symbol: '✓', label: 'done', color: STICKER_PALETTE.lime },
  now: { symbol: '…', label: 'in progress', color: STICKER_PALETTE.gold },
  waiting: { symbol: '', label: 'waiting', color: STICKER_PALETTE.ink },
} as const satisfies Record<StepStatus, { symbol: string; label: string; color: string }>

const BOB_TRANSITION = { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } as const

const stripesMove = keyframes`
  to { background-position: ${STRIPE_TILE}px 0; }
`

const stepStatus = (index: number, current: ScoutingStage): StepStatus => {
  const currentIndex = STEPS.findIndex((step) => step.stage === current)
  if (index < currentIndex) return 'done'
  return index === currentIndex ? 'now' : 'waiting'
}

const ScoutingProgress = ({ username, stage, progress }: ScoutingProgressProps) => {
  const reduceMotion = useReducedMotion()
  const gamesFill = progress ? Math.min(100, (progress.gamesCollected / progress.target) * 100) : 0

  return (
    <Box sx={{ display: 'grid', justifyItems: 'center', gap: 2.75, maxWidth: 520, mx: 'auto', pt: 1.25 }}>
      <Box sx={{ width: 'min(250px, 70vw)', aspectRatio: CARD_ASPECT_RATIO }}>
        <motion.div
          style={{ height: '100%', rotate: -2 }}
          animate={reduceMotion ? undefined : { rotate: [-4, 3, -4], y: [0, -10, 0] }}
          transition={BOB_TRANSITION}
        >
          <CardBack />
        </motion.div>
      </Box>

      <Typography
        component="h1"
        sx={{
          ...smallPosterTextSx,
          fontSize: 'clamp(1.4rem, 5vw, 2rem)',
          lineHeight: 1,
          letterSpacing: '0.04em',
          textAlign: 'center',
          overflowWrap: 'anywhere',
        }}
      >
        PRINTING {username}&apos;S CARD
      </Typography>
      <Typography sx={{ mt: -1.25, color: 'text.secondary', fontWeight: 600, textAlign: 'center' }}>
        Digging through {username}&apos;s dirty laundry…
      </Typography>

      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1, width: '100%' }}>
        {STEPS.map((step, index) => {
          const status = stepStatus(index, stage)
          const mark = STATUS_MARKS[status]
          const isGames = step.stage === 'games'

          return (
            <Box
              component="li"
              key={step.stage}
              sx={{
                display: 'grid',
                gridTemplateColumns: '26px 1fr auto',
                alignItems: 'center',
                gap: 1.25,
                px: 1.5,
                py: 1,
                fontWeight: 700,
                fontSize: '0.88rem',
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
                color: status === 'waiting' ? 'text.secondary' : 'text.primary',
                bgcolor: 'background.paper',
                border: `2.5px solid ${INK}`,
                borderRadius: STICKER_RADIUS,
                boxShadow: hardShadow(3),
              }}
            >
              <Box
                component="span"
                role="img"
                aria-label={mark.label}
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 22,
                  height: 22,
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  lineHeight: 1,
                  color: INK,
                  bgcolor: mark.color,
                  border: `2.5px solid ${INK}`,
                  borderRadius: '4px',
                }}
              >
                {mark.symbol}
              </Box>
              <span>{step.label}</span>
              <Box component="small" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {isGames && progress
                  ? `Archive ${progress.archivesFetched}/${progress.totalArchives} · ${progress.gamesCollected}/${progress.target} games`
                  : null}
              </Box>
              {isGames && (
                <Box
                  aria-hidden
                  sx={{
                    gridColumn: '1 / -1',
                    height: 18,
                    overflow: 'hidden',
                    bgcolor: 'background.default',
                    border: `2.5px solid ${INK}`,
                    borderRadius: '4px',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${gamesFill}%`,
                      borderRight: gamesFill > 0 ? `2.5px solid ${INK}` : 'none',
                      background: (theme) =>
                        `repeating-linear-gradient(-45deg, ${theme.palette.primary.main} 0 10px, ${darken(theme.palette.primary.main, 0.1)} 10px 20px)`,
                      backgroundSize: `${STRIPE_TILE}px ${STRIPE_TILE}px`,
                      animation: `${stripesMove} 0.8s linear infinite`,
                      transition: 'width 0.4s',
                      '@media (prefers-reduced-motion: reduce)': { animation: 'none', transition: 'none' },
                    }}
                  />
                </Box>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default ScoutingProgress
