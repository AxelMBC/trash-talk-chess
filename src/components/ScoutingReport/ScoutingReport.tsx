import { useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { motion } from 'motion/react'
import useScoutingReport from '@/hooks/useScoutingReport'
import { pickRoasts } from '@/data/roasts'
import { formatRelativeTime } from '@/utils/time'
import type { PlayerDossier, TerminationBreakdown, TimeClass } from '@/types/dossier.types'
import type { ScoutingReportProps } from './ScoutingReport.types'

const TIME_CLASS_LABELS: Record<TimeClass, string> = {
  rapid: 'Rapid',
  blitz: 'Blitz',
  bullet: 'Bullet',
  daily: 'Daily',
}

const TERMINATION_LABELS: Record<keyof TerminationBreakdown, string> = {
  checkmate: 'checkmate',
  resignation: 'resignation',
  timeout: 'timeout',
  abandonment: 'abandonment',
  other: 'other',
}

const describeTerminations = (endings: TerminationBreakdown): string => {
  const parts = (Object.keys(endings) as Array<keyof TerminationBreakdown>)
    .filter((key) => endings[key] > 0)
    .map((key) => `${endings[key]} by ${TERMINATION_LABELS[key]}`)
  return parts.length > 0 ? parts.join(', ') : '—'
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>
      {title}
    </Typography>
    {children}
  </Paper>
)

const StatRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Stack direction="row" spacing={2} sx={{ py: 0.5, justifyContent: 'space-between' }}>
    <Typography sx={{ color: 'text.secondary' }}>{label}</Typography>
    <Typography sx={{ fontWeight: 600, textAlign: 'right' }}>{value}</Typography>
  </Stack>
)

const ReportBody = ({ dossier }: { dossier: PlayerDossier }) => {
  const { career, recent } = dossier
  const roasts = pickRoasts(dossier)

  return (
    <Stack spacing={2.5}>
      <Paper
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'primary.main',
          background: 'linear-gradient(160deg, rgba(245, 185, 66, 0.12), rgba(20, 25, 38, 0.6))',
        }}
      >
        <Stack spacing={1.5}>
          {roasts.map((line) => (
            <Typography key={line} sx={{ fontWeight: 600, fontStyle: 'italic' }}>
              “{line}”
            </Typography>
          ))}
        </Stack>
      </Paper>

      <Section title="Career">
        <StatRow
          label="On chess.com since"
          value={`${new Date(career.joinedAt).toLocaleDateString()} (${career.accountAgeYears} years)`}
        />
        <StatRow label="Lifetime games" value={career.lifetimeGames.toLocaleString()} />
        {(Object.entries(career.ratings) as Array<[TimeClass, NonNullable<typeof career.ratings.rapid>]>).map(
          ([timeClass, block]) => (
            <StatRow
              key={timeClass}
              label={TIME_CLASS_LABELS[timeClass]}
              value={`${block.current}${block.best !== null ? ` (peak ${block.best})` : ''} · ${block.record.win}W ${block.record.loss}L ${block.record.draw}D`}
            />
          ),
        )}
      </Section>

      {recent.sampleSize === 0 ? (
        <Section title="Recent form">
          <Typography sx={{ color: 'text.secondary' }}>
            No recent games to analyze. The scouting department came back empty-handed.
          </Typography>
        </Section>
      ) : (
        <Section title={`Recent form — last ${recent.sampleSize} games`}>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <Chip label={`${recent.wins} W`} color="success" size="small" />
            <Chip label={`${recent.losses} L`} color="error" size="small" />
            <Chip label={`${recent.draws} D`} size="small" />
            {recent.favoriteTimeClass && (
              <Chip
                label={`Mostly ${TIME_CLASS_LABELS[recent.favoriteTimeClass]}`}
                color="secondary"
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
          <StatRow label="Wins arrived by" value={describeTerminations(recent.winEndings)} />
          <StatRow label="Losses ended by" value={describeTerminations(recent.lossEndings)} />
          {recent.currentStreak && (
            <StatRow
              label="Current streak"
              value={`${recent.currentStreak.length} ${recent.currentStreak.kind}${recent.currentStreak.length > 1 ? 's' : ''} in a row`}
            />
          )}
          <StatRow label="Longest loss streak" value={recent.longestLossStreak} />
          {recent.accuracy && (
            <StatRow
              label="Average accuracy"
              value={`${recent.accuracy.average}% (across ${recent.accuracy.sampleSize} games)`}
            />
          )}
          {recent.topOpenings.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ color: 'text.secondary', mb: 1 }}>Favorite openings</Typography>
              {recent.topOpenings.map((opening) => (
                <StatRow
                  key={opening.name}
                  label={opening.name}
                  value={`×${opening.count} · ${opening.record.win}W ${opening.record.loss}L ${opening.record.draw}D`}
                />
              ))}
            </Box>
          )}
        </Section>
      )}
    </Stack>
  )
}

const ScoutingReport = ({ username, onExitToMenu }: ScoutingReportProps) => {
  const { state, scout, rescout } = useScoutingReport()

  useEffect(() => {
    scout(username)
  }, [scout, username])

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background:
          'radial-gradient(1100px 640px at 50% -10%, rgba(245, 185, 66, 0.14), transparent 60%), #0b0e14',
        px: 3,
        py: 4,
      }}
    >
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        <Stack direction="row" sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
          <Button onClick={onExitToMenu} color="inherit" sx={{ color: 'text.secondary' }}>
            ← Menu
          </Button>
          {state.phase === 'ready' && (
            <Button variant="outlined" color="secondary" size="small" onClick={rescout}>
              Re-scout
            </Button>
          )}
        </Stack>

        {state.phase === 'loading' && (
          <Stack spacing={3} sx={{ mt: 10, alignItems: 'center' }}>
            <CircularProgress color="primary" />
            <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Digging through {state.username}&apos;s dirty laundry…
            </Typography>
            {state.progress && (
              <Box sx={{ width: '100%', maxWidth: 380 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (state.progress.gamesCollected / state.progress.target) * 100)}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary', textAlign: 'center' }}>
                  Archive {state.progress.archivesFetched}/{state.progress.totalArchives} ·{' '}
                  {state.progress.gamesCollected}/{state.progress.target} games
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {state.phase === 'error' && (
          <Stack spacing={2} sx={{ mt: 10, textAlign: 'center', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {state.error.kind === 'user-not-found'
                ? `“${state.username}”? chess.com has never heard of them.`
                : 'The scouting mission failed.'}
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              {state.error.kind === 'user-not-found'
                ? 'Check the spelling and try again — or maybe they were too embarrassed to sign up.'
                : state.error.message}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Button variant="outlined" color="inherit" onClick={onExitToMenu}>
                Back to menu
              </Button>
              {state.error.kind !== 'user-not-found' && (
                <Button variant="contained" onClick={() => scout(state.username)}>
                  Retry
                </Button>
              )}
            </Stack>
          </Stack>
        )}

        {state.phase === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Scouting report: {state.dossier.username}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 3 }}>
              Scouted {formatRelativeTime(state.dossier.fetchedAt)}
              {state.fromCache ? ' · from cache' : ''}
            </Typography>
            <ReportBody dossier={state.dossier} />
          </motion.div>
        )}
      </Box>
    </Box>
  )
}

export default ScoutingReport
