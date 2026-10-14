import Box from '@mui/material/Box'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { speechBubbleSx } from '@/theme/sticker'
import type { TrashTalkBubbleProps } from './TrashTalkBubble.types'

/** Fixed slot height so lines appearing and leaving never shift the board. */
const SLOT_HEIGHT_PX = 56

/**
 * The engine's speech bubble. Purely presentational: renders whatever line it
 * is given inside a reserved slot above the board. `pointer-events: none`
 * everywhere, so it can never eat a click meant for a square.
 */
const TrashTalkBubble = ({ line }: TrashTalkBubbleProps) => {
  const reduceMotion = useReducedMotion()

  return (
    <Box
      aria-live="polite"
      sx={{
        position: 'relative',
        height: `${SLOT_HEIGHT_PX}px`,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      <AnimatePresence>
        {line && (
          <motion.div
            key={line.id}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.22, ease: 'easeIn' } }
            }
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              data-testid="trash-talk-line"
              sx={[speechBubbleSx('up'), { maxWidth: '94%', py: 0.75, fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }]}
            >
              “{line.text}”
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}

export default TrashTalkBubble
