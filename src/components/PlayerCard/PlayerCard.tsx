import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { alpha, type Theme } from '@mui/material/styles'
import { motion, useReducedMotion } from 'motion/react'
import CardBack from '@/components/CardBack'
import RookCollage from '@/components/RookCollage'
import { bestCurrentRating } from '@/services/dossier'
import { DISPLAY_FONT_FAMILY, STICKER_COLORS, STICKER_PALETTE } from '@/theme/theme'
import { STICKER_RADIUS, hardShadow } from '@/theme/sticker'
import { CARD_ASPECT_RATIO, CARD_FACE_SX, CARD_WIDTH, cardTier } from '@/theme/card'
import { PIECE_IMAGES, PIECE_NAMES } from '@/utils/pieces'
import { TIME_CLASS_LABELS } from '@/utils/timeClass'
import type { PlayerDossier } from '@/types/dossier.types'
import { cardBadge, cardStats, cardStreakSticker, cardTypeLine } from './cardFacts'
import type { PlayerCardProps } from './PlayerCard.types'

const INK = STICKER_COLORS.ink
const PAPER = STICKER_COLORS.paper
const BADGE_SIZE = 64

const DIE_CUT_FILTER = [
  `drop-shadow(3px 0 0 ${PAPER})`,
  `drop-shadow(-3px 0 0 ${PAPER})`,
  `drop-shadow(0 3px 0 ${PAPER})`,
  `drop-shadow(0 -3px 0 ${PAPER})`,
  `drop-shadow(5px 6px 0 ${INK})`,
].join(' ')

const FLIP_SPRING = { type: 'spring', stiffness: 110, damping: 15 } as const
const STREAK_SLAP = { type: 'spring', stiffness: 600, damping: 18, delay: 0.75 } as const

const smallCapsSx = {
  fontFamily: (theme: Theme) => theme.typography.fontFamily,
  fontWeight: 800,
  lineHeight: 1,
  textTransform: 'uppercase',
} as const

const CardFront = ({ dossier, roast }: { dossier: PlayerDossier; roast: string }) => {
  const tier = cardTier(bestCurrentRating(dossier))
  const badge = cardBadge(dossier)

  return (
    <Box
      sx={{
        ...CARD_FACE_SX,
        position: 'relative',
        aspectRatio: CARD_ASPECT_RATIO,
        display: 'grid',
        gridTemplateRows: 'auto auto auto auto 1fr auto',
        gap: 1,
        p: 1.5,
        bgcolor: tier.color,
        color: INK,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Typography
          component="h1"
          sx={{
            minWidth: 0,
            fontFamily: DISPLAY_FONT_FAMILY,
            fontSize: '1.75rem',
            lineHeight: 1,
            letterSpacing: '0.02em',
            overflowWrap: 'anywhere',
          }}
        >
          <Box component="span" sx={{ ...smallCapsSx, display: 'block', mb: '3px', fontSize: '0.62rem', letterSpacing: '0.12em' }}>
            Scouting report
          </Box>{' '}
          {dossier.username}
        </Typography>
        <Box
          sx={{
            flexShrink: 0,
            display: 'grid',
            placeContent: 'center',
            gap: '2px',
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            textAlign: 'center',
            bgcolor: INK,
            color: PAPER,
            border: `3px solid ${PAPER}`,
            outline: `2.5px solid ${INK}`,
            borderRadius: '50%',
            transform: 'rotate(6deg)',
          }}
        >
          <Box component="span" sx={{ fontFamily: DISPLAY_FONT_FAMILY, fontSize: '1.45rem', lineHeight: 1 }}>
            {badge ? badge.rating : '—'}
          </Box>
          <Box component="span" sx={{ ...smallCapsSx, fontSize: '0.5rem', letterSpacing: '0.14em' }}>
            {badge ? TIME_CLASS_LABELS[badge.timeClass] : 'Unrated'}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          aspectRatio: '16 / 10',
          overflow: 'hidden',
          bgcolor: STICKER_PALETTE.ink,
          border: `3px solid ${INK}`,
          borderRadius: '8px',
        }}
      >
        <RookCollage tone="quiet" />
        <Box
          component="img"
          src={PIECE_IMAGES.w[tier.piece]}
          alt=""
          sx={{ position: 'absolute', top: '9%', left: '50%', height: '82%', transform: 'translateX(-50%)', filter: DIE_CUT_FILTER }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: -4,
            right: -4,
            bottom: 10,
            py: '5px',
            fontFamily: DISPLAY_FONT_FAMILY,
            fontSize: '0.9rem',
            lineHeight: 1,
            letterSpacing: '0.14em',
            textAlign: 'center',
            textTransform: 'uppercase',
            bgcolor: PAPER,
            borderBlock: `2.5px solid ${INK}`,
            transform: 'rotate(-3deg)',
          }}
        >
          {tier.name} · Spirit piece: {PIECE_NAMES[tier.piece]}
        </Box>
      </Box>

      <Typography
        sx={{
          ...smallCapsSx,
          fontSize: '0.72rem',
          lineHeight: 1.3,
          letterSpacing: '0.06em',
          pb: '6px',
          borderBottom: `2px solid ${INK}`,
        }}
      >
        {cardTypeLine(dossier, badge)}
      </Typography>

      <Box
        component="dl"
        sx={{
          m: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          bgcolor: PAPER,
          border: `2.5px solid ${INK}`,
          borderRadius: STICKER_RADIUS,
          '& > div:not(:nth-of-type(3n))': { borderRight: `2px solid ${INK}` },
          '& > div:nth-of-type(-n + 3)': { borderBottom: `2px solid ${INK}` },
        }}
      >
        {cardStats(dossier).map((stat) => (
          <Box
            key={stat.label}
            sx={{
              display: 'flex',
              flexDirection: 'column-reverse',
              alignItems: 'center',
              gap: '3px',
              px: 0.5,
              pt: '5px',
              pb: '6px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <Box component="dt" sx={{ ...smallCapsSx, fontSize: '0.55rem', letterSpacing: '0.14em' }}>
              {stat.label}
            </Box>
            <Box component="dd" sx={{ m: 0, fontFamily: DISPLAY_FONT_FAMILY, fontSize: '1.35rem', lineHeight: 1 }}>
              {stat.value}
            </Box>
          </Box>
        ))}
      </Box>

      <Typography
        sx={{
          px: '9px',
          py: '7px',
          fontSize: '0.8rem',
          fontWeight: 700,
          lineHeight: 1.35,
          bgcolor: (theme) => alpha(theme.palette.common.white, 0.55),
          border: `2px solid ${INK}`,
          borderRadius: STICKER_RADIUS,
        }}
      >
        {roast}
      </Typography>

      <Box sx={{ ...smallCapsSx, display: 'flex', justifyContent: 'space-between', fontSize: '0.56rem', letterSpacing: '0.14em' }}>
        <span>Trash Talk Chess</span>
        <span>No. {dossier.career.lifetimeGames.toLocaleString()}</span>
      </Box>
    </Box>
  )
}

const PlayerCard = ({ dossier, roast, reveal }: PlayerCardProps) => {
  const reduceMotion = useReducedMotion()
  const isFlipping = reveal === 'flip' && !reduceMotion
  const streakSticker = cardStreakSticker(dossier)

  return (
    <Box
      sx={{
        position: 'relative',
        justifySelf: 'center',
        width: '100%',
        maxWidth: CARD_WIDTH,
        perspective: '1400px',
        transform: 'rotate(-2deg)',
      }}
    >
      <motion.div
        initial={isFlipping ? { rotateY: 180 } : false}
        animate={{ rotateY: 0 }}
        transition={FLIP_SPRING}
        style={{ position: 'relative', transformStyle: 'preserve-3d' }}
      >
        <CardFront dossier={dossier} roast={roast} />
        {isFlipping && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <CardBack />
          </Box>
        )}
      </motion.div>

      {streakSticker && (
        <Box sx={{ position: 'absolute', top: '42%', right: { xs: -6, md: -18 }, zIndex: 1 }}>
          <motion.div
            initial={isFlipping ? { opacity: 0, scale: 1.8 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={STREAK_SLAP}
          >
            <Box
              sx={{
                maxWidth: '7em',
                px: '9px',
                py: '6px',
                fontFamily: DISPLAY_FONT_FAMILY,
                fontSize: '1rem',
                lineHeight: 1.05,
                letterSpacing: '0.06em',
                textAlign: 'center',
                textTransform: 'uppercase',
                color: INK,
                bgcolor: streakSticker.color,
                border: `3px solid ${INK}`,
                boxShadow: hardShadow(4),
                transform: 'rotate(12deg)',
              }}
            >
              {streakSticker.text}
            </Box>
          </motion.div>
        </Box>
      )}
    </Box>
  )
}

export default PlayerCard
