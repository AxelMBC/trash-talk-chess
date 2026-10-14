import { bestCurrentRating } from '@/services/dossier'
import { STICKER_PALETTE } from '@/theme/theme'
import { TIME_CLASS_LABELS } from '@/utils/timeClass'
import type { GameOutcome, PlayerDossier, RatingBlock, TimeClass } from '@/types/dossier.types'

interface CardBadge {
  rating: number
  timeClass: TimeClass
}

interface CardStat {
  label: string
  value: string
}

const MISSING = '—'
const STREAK_STICKER_MIN_LENGTH = 3

const STREAK_LETTERS: Record<GameOutcome, string> = { win: 'W', loss: 'L', draw: 'D' }
const STREAK_WORDS: Record<GameOutcome, string> = { win: 'wins', loss: 'losses', draw: 'draws' }
const STREAK_COLORS: Record<GameOutcome, string> = {
  win: STICKER_PALETTE.lime,
  loss: STICKER_PALETTE.orange,
  draw: STICKER_PALETTE.cream,
}

const percent = (part: number, whole: number): string =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : MISSING

const countOf = (count: number, noun: string): string =>
  `${count.toLocaleString()} ${noun}${count === 1 ? '' : 's'}`

export const cardBadge = (dossier: PlayerDossier): CardBadge | null => {
  const { ratings } = dossier.career
  const favorite = dossier.recent.favoriteTimeClass
  const favoriteBlock = favorite ? ratings[favorite] : undefined
  if (favorite && favoriteBlock) return { rating: favoriteBlock.current, timeClass: favorite }

  let best: CardBadge | null = null
  for (const [timeClass, block] of Object.entries(ratings) as Array<[TimeClass, RatingBlock]>) {
    if (!best || block.current > best.rating) best = { rating: block.current, timeClass }
  }
  return best
}

export const cardTypeLine = (dossier: PlayerDossier, badge: CardBadge | null): string => {
  const years = Math.floor(dossier.career.accountAgeYears)
  return [
    badge && `${TIME_CLASS_LABELS[badge.timeClass]} main`,
    years > 0 ? `${countOf(years, 'year')} on chess.com` : 'New on chess.com',
    countOf(dossier.career.lifetimeGames, 'game'),
  ]
    .filter(Boolean)
    .join(' · ')
}

export const cardStats = (dossier: PlayerDossier): CardStat[] => {
  const { career, recent } = dossier
  const bests = Object.values(career.ratings).flatMap((block) => (block.best !== null ? [block.best] : []))
  const peak = bests.length > 0 ? Math.max(...bests) : bestCurrentRating(dossier)
  const streak = recent.currentStreak

  return [
    { label: 'PEAK', value: peak !== null ? String(peak) : MISSING },
    { label: 'WIN', value: percent(recent.wins, recent.sampleSize) },
    { label: 'RESIGNS', value: percent(recent.lossEndings.resignation, recent.losses) },
    { label: 'ACCURACY', value: recent.accuracy ? String(Math.round(recent.accuracy.average)) : MISSING },
    { label: 'STREAK', value: streak ? `${STREAK_LETTERS[streak.kind]}${streak.length}` : MISSING },
    { label: 'WORST RUN', value: recent.sampleSize > 0 ? String(recent.longestLossStreak) : MISSING },
  ]
}

export const cardStreakSticker = (dossier: PlayerDossier): { text: string; color: string } | null => {
  const streak = dossier.recent.currentStreak
  if (!streak || streak.length < STREAK_STICKER_MIN_LENGTH) return null
  return { text: `${streak.length} ${STREAK_WORDS[streak.kind]} in a row`, color: STREAK_COLORS[streak.kind] }
}
