import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import { keyframes } from '@emotion/react'
import { BOARD_COLORS } from '@/theme/theme'
import type { BoardSquareProps } from './BoardSquare.types'

const checkPulse = keyframes`
  0%, 100% { opacity: 0.9; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.92); }
`

const BoardSquare = ({
  square,
  isDark,
  isSelected,
  isLegalTarget,
  isCaptureTarget,
  isLastMove,
  isCheck,
  fileLabel,
  rankLabel,
  labelsHidden,
  label,
  onClick,
}: BoardSquareProps) => {
  const labelColor = isDark ? BOARD_COLORS.lightSquare : BOARD_COLORS.darkSquare

  return (
    <ButtonBase
      data-square={square}
      aria-label={label}
      aria-pressed={isSelected}
      disableRipple
      onClick={() => onClick(square)}
      sx={{
        position: 'relative',
        display: 'block',
        backgroundColor: isDark ? BOARD_COLORS.darkSquare : BOARD_COLORS.lightSquare,
        WebkitTapHighlightColor: 'transparent',
        '&.Mui-focusVisible': { outline: `3px solid ${BOARD_COLORS.selected}`, outlineOffset: -3 },
      }}
    >
      {isLastMove && (
        <Box
          component="span"
          sx={{ position: 'absolute', inset: 0, backgroundColor: BOARD_COLORS.lastMove }}
        />
      )}
      {isSelected && (
        <Box
          component="span"
          sx={{ position: 'absolute', inset: 0, backgroundColor: BOARD_COLORS.selected }}
        />
      )}
      {isCheck && (
        <Box
          component="span"
          sx={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle, ${BOARD_COLORS.check} 20%, rgba(232, 55, 55, 0.35) 55%, transparent 75%)`,
            animation: `${checkPulse} 1.1s ease-in-out infinite`,
          }}
        />
      )}
      {isLegalTarget && !isCaptureTarget && (
        <Box
          component="span"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '30%',
            height: '30%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            backgroundColor: BOARD_COLORS.legalDot,
          }}
        />
      )}
      {isCaptureTarget && (
        <Box
          component="span"
          sx={{
            position: 'absolute',
            inset: '4%',
            borderRadius: '50%',
            border: '0.35em solid',
            borderColor: BOARD_COLORS.captureRing,
            fontSize: 'clamp(6px, 1.4vw, 12px)',
          }}
        />
      )}
      {rankLabel && (
        <Box
          component="span"
          sx={{
            position: 'absolute',
            top: '3%',
            left: '5%',
            fontSize: 'clamp(8px, 1.5vw, 13px)',
            fontWeight: 700,
            color: labelColor,
            lineHeight: 1,
            opacity: labelsHidden ? 0 : 1,
            transition: 'opacity 120ms ease',
          }}
        >
          {rankLabel}
        </Box>
      )}
      {fileLabel && (
        <Box
          component="span"
          sx={{
            position: 'absolute',
            bottom: '3%',
            right: '5%',
            fontSize: 'clamp(8px, 1.5vw, 13px)',
            fontWeight: 700,
            color: labelColor,
            lineHeight: 1,
            opacity: labelsHidden ? 0 : 1,
            transition: 'opacity 120ms ease',
          }}
        >
          {fileLabel}
        </Box>
      )}
    </ButtonBase>
  )
}

export default BoardSquare
