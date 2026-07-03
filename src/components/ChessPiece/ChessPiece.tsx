import { motion, useTransform } from 'motion/react'
import { PIECE_IMAGES, PIECE_NAMES } from '@/utils/pieces'
import { colorName } from '@/utils/board'
import type { ChessPieceProps } from './ChessPiece.types'

const ChessPiece = ({ piece, boardRotation, col, row, isElevated }: ChessPieceProps) => {
  // Cancels the board's turn so the glyph stays upright while riding the rotation.
  const counterRotation = useTransform(boardRotation, (deg) => -deg)

  return (
    <motion.div
      initial={false}
      animate={{ x: `${col * 100}%`, y: `${row * 100}%`, scale: 1, opacity: 1 }}
      exit={{ scale: 0.4, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '12.5%',
        height: '12.5%',
        zIndex: isElevated ? 2 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.img
        src={PIECE_IMAGES[piece.color][piece.type]}
        alt={`${colorName(piece.color)} ${PIECE_NAMES[piece.type]}`}
        style={{
          width: '88%',
          height: '88%',
          rotate: counterRotation,
          filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35))',
        }}
      />
    </motion.div>
  )
}

export default ChessPiece
