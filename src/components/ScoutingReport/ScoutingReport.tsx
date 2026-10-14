import { useEffect } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { alpha, type Theme } from '@mui/material/styles'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import PlayerCard from '@/components/PlayerCard'
import RookCollage from '@/components/RookCollage'
import ScoutingProgress from '@/components/ScoutingProgress'
import useScoutingReport from '@/hooks/useScoutingReport'
import { pickRoasts } from '@/data/roasts'
import type { ScoutError } from '@/services/chesscom'
import { ENGINE_NAME } from '@/services/engine'
import { DISPLAY_FONT_FAMILY, STICKER_COLORS, STICKER_PALETTE } from '@/theme/theme'
import {
  STICKER_RADIUS,
  hardShadow,
  labelStickerSx,
  smallPosterTextSx,
  speechBubbleSx,
  stickerButtonSx,
  stickerPanelSx,
} from '@/theme/sticker'
import { CARD_ASPECT_RATIO, CARD_RADIUS, CARD_WIDTH, cardTier } from '@/theme/card'
import { formatRelativeTime } from '@/utils/time'
import { TIME_CLASS_LABELS } from '@/utils/timeClass'
import type { PlayerDossier, RatingBlock, TerminationBreakdown, TimeClass } from '@/types/dossier.types'
import type { ScoutingReportProps } from './ScoutingReport.types'

const INK = STICKER_COLORS.ink
const PAPER = STICKER_COLORS.paper
const PAGE_MAX_WIDTH = 1020

const EMPTY_ACCOUNT_MESSAGE = 'No recent games to analyze. The scouting department came back empty-handed.'
const NOT_FOUND_EXPLANATION =
  'chess.com has never heard of them. Check the spelling and try again — or maybe they were too embarrassed to sign up.'

const TERMINATION_LABELS: Record<keyof TerminationBreakdown, string> = {
  checkmate: 'Checkmate',
  resignation: 'Resignation',
  timeout: 'Timeout',
  abandonment: 'Abandonment',
  other: 'Other',
}

const PANEL_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0 },
}

const mutedCapsSx = {
  fontWeight: 700,
  fontSize: '0.7rem',
  lineHeight: 1.2,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'text.secondary',
} as const

const darkTagSx = {
  bgcolor: (theme: Theme) => alpha(theme.palette.background.default, 0.75),
  borderRadius: STICKER_RADIUS,
} as const

const ReportPanel = ({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) => (
  <motion.section variants={PANEL_VARIANTS}>
    <Box sx={{ ...stickerPanelSx, display: 'grid', gap: 1.75, px: 2.25, pt: 2.25, pb: 2.5 }}>
      <Typography
        component="h2"
        sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}
      >
        <Box
          component="span"
          sx={{
            fontFamily: DISPLAY_FONT_FAMILY,
            fontSize: '1.3rem',
            lineHeight: 1,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: PAPER,
          }}
        >
          {title}
        </Box>
        {aside && (
          <Box component="small" sx={mutedCapsSx}>
            {aside}
          </Box>
        )}
      </Typography>
      {children}
    </Box>
  </motion.section>
)

const RatingChip = ({ timeClass, block }: { timeClass: TimeClass; block: RatingBlock }) => (
  <Box
    sx={{
      display: 'grid',
      gap: '2px',
      minWidth: 120,
      px: 1.25,
      pt: 0.75,
      pb: '7px',
      color: INK,
      bgcolor: cardTier(block.current).color,
      border: `2.5px solid ${INK}`,
      borderRadius: STICKER_RADIUS,
      boxShadow: hardShadow(3),
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    <Box
      component="span"
      sx={{ fontFamily: DISPLAY_FONT_FAMILY, fontSize: '0.8rem', lineHeight: 1, letterSpacing: '0.12em', textTransform: 'uppercase' }}
    >
      {TIME_CLASS_LABELS[timeClass]}
    </Box>
    <Box component="span" sx={{ fontFamily: DISPLAY_FONT_FAMILY, fontSize: '1.7rem', lineHeight: 1 }}>
      {block.current}
    </Box>
    <Box component="span" sx={{ fontWeight: 600, fontSize: '0.74rem', lineHeight: 1.3 }}>
      {block.best !== null && `peak ${block.best} · `}
      {block.record.win}W {block.record.loss}L {block.record.draw}D
    </Box>
  </Box>
)

const ResultBar = ({ wins, draws, losses }: { wins: number; draws: number; losses: number }) => {
  const total = wins + draws + losses
  const segments = [
    { key: 'win', count: wins, suffix: 'W', color: STICKER_PALETTE.lime, justify: 'flex-start' },
    { key: 'draw', count: draws, suffix: 'D', color: STICKER_PALETTE.cream, justify: 'center' },
    { key: 'loss', count: losses, suffix: 'L', color: STICKER_PALETTE.orange, justify: 'flex-end' },
  ].filter((segment) => segment.count > 0)

  return (
    <Box
      role="img"
      aria-label={`${wins} wins, ${draws} draws, ${losses} losses`}
      sx={{
        display: 'flex',
        height: 36,
        overflow: 'hidden',
        fontFamily: DISPLAY_FONT_FAMILY,
        fontSize: '1rem',
        lineHeight: 1,
        letterSpacing: '0.05em',
        color: INK,
        border: `2.5px solid ${INK}`,
        borderRadius: '4px',
        boxShadow: hardShadow(3),
      }}
    >
      {segments.map((segment, index) => (
        <Box
          key={segment.key}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: segment.justify,
            width: `${(segment.count / total) * 100}%`,
            px: 1.25,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            bgcolor: segment.color,
            borderLeft: index > 0 ? `2.5px solid ${INK}` : 'none',
          }}
        >
          {segment.count} {segment.suffix}
        </Box>
      ))}
    </Box>
  )
}

const EndingBars = ({
  heading,
  endings,
  highlight,
}: {
  heading: string
  endings: TerminationBreakdown
  highlight?: keyof TerminationBreakdown
}) => {
  const kinds = (Object.keys(endings) as Array<keyof TerminationBreakdown>)
    .filter((kind) => endings[kind] > 0)
    .sort((a, b) => endings[b] - endings[a])
  const total = kinds.reduce((sum, kind) => sum + endings[kind], 0)
  if (total === 0) return null

  return (
    <Box sx={{ display: 'grid', gap: '7px' }}>
      <Typography component="h3" sx={{ ...mutedCapsSx, fontSize: '0.72rem', mt: 0.5, mb: '3px' }}>
        {heading}
      </Typography>
      {kinds.map((kind) => (
        <Box
          key={kind}
          sx={{
            display: 'grid',
            gridTemplateColumns: '7.2rem 1fr 2rem',
            alignItems: 'center',
            gap: 1,
            fontWeight: 600,
            fontSize: '0.82rem',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>{TERMINATION_LABELS[kind]}</span>
          <Box
            aria-hidden
            sx={{
              height: 12,
              width: `${(endings[kind] / total) * 100}%`,
              borderRadius: '2px',
              bgcolor: kind === highlight ? STICKER_PALETTE.orange : PAPER,
            }}
          />
          <Box component="span" sx={{ textAlign: 'right' }}>
            {endings[kind]}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

const ReportView = ({
  dossier,
  reveal,
}: {
  dossier: PlayerDossier
  reveal: ComponentProps<typeof PlayerCard>['reveal']
}) => {
  const reduceMotion = useReducedMotion()
  const { career, recent } = dossier
  const [flavorRoast, ...extraRoasts] = pickRoasts(dossier)
  const ratings = Object.entries(career.ratings) as Array<[TimeClass, RatingBlock]>
  const joined = new Date(career.joinedAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const favorite = recent.favoriteTimeClass

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: `${CARD_WIDTH}px minmax(0, 1fr)` },
        gap: { xs: 4, md: 5 },
        alignItems: 'start',
      }}
    >
      <PlayerCard dossier={dossier} roast={flavorRoast} reveal={reveal} />

      <motion.div
        initial={reduceMotion ? false : 'hidden'}
        animate="shown"
        variants={{
          hidden: {},
          shown: { transition: { staggerChildren: 0.08, delayChildren: reveal === 'flip' ? 0.5 : 0.1 } },
        }}
        style={{ display: 'grid', gap: 22, minWidth: 0 }}
      >
        <ReportPanel title="Ratings" aside={`since ${joined}`}>
          {ratings.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
              {ratings.map(([timeClass, block]) => (
                <RatingChip key={timeClass} timeClass={timeClass} block={block} />
              ))}
            </Box>
          ) : (
            <Typography sx={{ color: 'text.secondary' }}>No rated games yet.</Typography>
          )}
        </ReportPanel>

        {recent.sampleSize === 0 ? (
          <ReportPanel title="Recent form">
            <Typography sx={{ color: 'text.secondary' }}>{EMPTY_ACCOUNT_MESSAGE}</Typography>
          </ReportPanel>
        ) : (
          <>
            <ReportPanel
              title="Recent form"
              aside={`last ${recent.sampleSize}${favorite ? ` · mostly ${TIME_CLASS_LABELS[favorite].toLowerCase()}` : ''}`}
            >
              <ResultBar wins={recent.wins} draws={recent.draws} losses={recent.losses} />
              <EndingBars heading="How the losses ended" endings={recent.lossEndings} highlight="resignation" />
              <EndingBars heading="How the wins came" endings={recent.winEndings} />
            </ReportPanel>

            {recent.topOpenings.length > 0 && (
              <ReportPanel title="Signature moves" aside="favourite openings">
                <Box
                  component="table"
                  sx={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.88rem',
                    lineHeight: 1.3,
                    fontVariantNumeric: 'tabular-nums',
                    '& th': { ...mutedCapsSx, fontSize: '0.68rem', textAlign: 'left', pb: '6px', borderBottom: '2px solid', borderColor: 'divider' },
                    '& td': { py: '7px', borderBottom: '1px solid', borderColor: 'divider' },
                    '& :is(th, td):not(:first-of-type)': { textAlign: 'right', pl: 1.25, whiteSpace: 'nowrap' },
                  }}
                >
                  <thead>
                    <tr>
                      <th scope="col">Opening</th>
                      <th scope="col">Games</th>
                      <th scope="col">W–L–D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.topOpenings.map((opening) => (
                      <tr key={opening.name}>
                        <td>{opening.name}</td>
                        <td>{opening.count}</td>
                        <td>
                          {opening.record.win}–{opening.record.loss}–{opening.record.draw}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </ReportPanel>
            )}
          </>
        )}

        {extraRoasts.length > 0 && (
          <ReportPanel title={`${ENGINE_NAME}’s take`}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: '12px 14px', alignItems: 'start' }}>
              <Box
                component="span"
                sx={{
                  ...labelStickerSx('primary.main', 2),
                  borderWidth: 2,
                  borderRadius: '3px',
                  px: 1,
                  pt: '5px',
                  pb: '6px',
                  fontSize: '0.95rem',
                  lineHeight: 1,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {ENGINE_NAME}
              </Box>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {extraRoasts.map((line) => (
                  <Box key={line} sx={speechBubbleSx('left')}>
                    {line}
                  </Box>
                ))}
              </Box>
            </Box>
          </ReportPanel>
        )}
      </motion.div>
    </Box>
  )
}

const ErrorView = ({
  username,
  error,
  onExit,
  onRetry,
}: {
  username: string
  error: ScoutError
  onExit: () => void
  onRetry: () => void
}) => {
  const isNotFound = error.kind === 'user-not-found'

  return (
    <Box sx={{ display: 'grid', justifyItems: 'center', gap: 2.25, maxWidth: 520, mx: 'auto', textAlign: 'center' }}>
      <Box
        aria-hidden
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 'min(230px, 64vw)',
          aspectRatio: CARD_ASPECT_RATIO,
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.6),
          border: `4px dashed ${PAPER}`,
          borderRadius: CARD_RADIUS,
          transform: 'rotate(3deg)',
        }}
      >
        <Box component="span" sx={{ fontFamily: DISPLAY_FONT_FAMILY, fontSize: '2.6rem', lineHeight: 1, color: PAPER }}>
          ?
        </Box>
      </Box>
      <Typography
        component="h1"
        sx={{
          ...smallPosterTextSx,
          fontSize: 'clamp(1.5rem, 5vw, 2.1rem)',
          lineHeight: 1.05,
          letterSpacing: '0.03em',
          textWrap: 'balance',
          overflowWrap: 'anywhere',
        }}
      >
        {isNotFound ? `NO CARD FOR “${username}”` : 'SCOUTING FAILED'}
      </Typography>
      <Typography sx={{ ...darkTagSx, px: 1.5, py: 1, lineHeight: 1.45 }}>
        {isNotFound ? NOT_FOUND_EXPLANATION : error.message}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5 }}>
        <Button variant="contained" onClick={onExit} sx={stickerButtonSx(PAPER, { size: 'small' })}>
          <span aria-hidden>←&nbsp;</span>Back to menu
        </Button>
        {!isNotFound && (
          <Button variant="contained" onClick={onRetry} sx={stickerButtonSx('primary.main', { size: 'small' })}>
            Retry
          </Button>
        )}
      </Box>
    </Box>
  )
}

const ScoutingReport = ({ username, onExitToMenu }: ScoutingReportProps) => {
  const { state, scout, rescout, cancel } = useScoutingReport()
  const reduceMotion = useReducedMotion()
  const viewKey = state.phase === 'ready' ? `ready-${state.dossier.fetchedAt}` : state.phase

  const handleExit = () => {
    cancel()
    onExitToMenu()
  }

  useEffect(() => {
    scout(username)
  }, [scout, username])

  return (
    <Box sx={{ position: 'relative', isolation: 'isolate', minHeight: '100dvh', overflowX: 'clip', px: 2, pt: 3, pb: 7 }}>
      <Box aria-hidden sx={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
        <RookCollage />
      </Box>

      <Box sx={{ maxWidth: PAGE_MAX_WIDTH, mx: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.25,
            mb: 3.25,
          }}
        >
          <Button
            variant="contained"
            onClick={handleExit}
            sx={{ ...stickerButtonSx('background.paper', { size: 'small' }), color: 'text.primary' }}
          >
            <span aria-hidden>←&nbsp;</span>Menu
          </Button>
          {state.phase === 'ready' && (
            <>
              <Box component="span" sx={{ ...darkTagSx, ...mutedCapsSx, fontSize: '0.74rem', px: 1.25, py: 0.75 }}>
                Scouted {formatRelativeTime(state.dossier.fetchedAt)}
                {state.fromCache ? ' · from cache' : ''}
              </Box>
              <Button variant="contained" onClick={rescout} sx={stickerButtonSx('secondary.main', { size: 'small' })}>
                Re-scout
              </Button>
            </>
          )}
        </Box>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
          >
            {state.phase === 'loading' && (
              <ScoutingProgress username={state.username} stage={state.stage} progress={state.progress} />
            )}
            {state.phase === 'error' && (
              <ErrorView
                username={state.username}
                error={state.error}
                onExit={handleExit}
                onRetry={rescout}
              />
            )}
            {state.phase === 'ready' && (
              <ReportView dossier={state.dossier} reveal={state.fromCache ? 'instant' : 'flip'} />
            )}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  )
}

export default ScoutingReport
