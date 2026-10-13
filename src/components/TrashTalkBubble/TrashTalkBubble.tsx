import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { TrashTalkBubbleProps } from './TrashTalkBubble.types'

/** Fixed slot height so lines appearing and leaving never shift the board. */
const SLOT_HEIGHT_PX = 56

const BUBBLE_BG = 'rgba(38, 30, 16, 0.96)'
const BUBBLE_BORDER = '1px solid rgba(245, 185, 66, 0.35)'

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
              sx={{
                position: 'relative',
                maxWidth: '94%',
                px: 1.75,
                py: 0.75,
                borderRadius: 2.5,
                backgroundColor: BUBBLE_BG,
                border: BUBBLE_BORDER,
                // Tail pointing up at the opponent's side of the table.
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -6,
                  left: 26,
                  width: 10,
                  height: 10,
                  transform: 'rotate(45deg)',
                  backgroundColor: BUBBLE_BG,
                  borderTop: BUBBLE_BORDER,
                  borderLeft: BUBBLE_BORDER,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  lineHeight: 1.35,
                  color: 'rgba(255, 236, 205, 0.95)',
                }}
              >
                🤖 “{line.text}”
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}

export default TrashTalkBubble
