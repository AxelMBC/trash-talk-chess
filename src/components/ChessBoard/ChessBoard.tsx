import Box from '@mui/material/Box'
import { AnimatePresence } from 'motion/react'
import type { Square } from 'chess.js'
import BoardSquare from '@/components/BoardSquare'
import ChessPiece from '@/components/ChessPiece'
import {
  colorName,
  isDarkSquare,
  orientedFiles,
  orientedRanks,
  squareToCol,
  squareToRow,
} from '@/utils/board'
import { PIECE_NAMES } from '@/utils/pieces'
import { STICKER_COLORS } from '@/theme/theme'
import { STICKER_RADIUS } from '@/theme/sticker'
import type { ChessBoardProps } from './ChessBoard.types'

const ChessBoard = ({
  pieces,
  orientation,
  boardRotation,
  labelsHidden,
  selectedSquare,
  legalMoves,
  lastMove,
  checkSquare,
  disabled,
  onSquareClick,
}: ChessBoardProps) => {
  const files = orientedFiles(orientation)
  const ranks = orientedRanks(orientation)
  const pieceBySquare = new Map(pieces.map((piece) => [piece.square, piece]))

  const squareLabel = (square: Square): string => {
    const piece = pieceBySquare.get(square)
    return piece ? `${square}, ${colorName(piece.color)} ${PIECE_NAMES[piece.type]}` : square
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        border: `3px solid ${STICKER_COLORS.ink}`,
        borderRadius: STICKER_RADIUS,
        overflow: 'hidden',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
          width: '100%',
          height: '100%',
        }}
      >
        {ranks.map((rank, rowIndex) =>
          files.map((file, colIndex) => {
            const square = `${file}${rank}` as Square
            return (
              <BoardSquare
                key={square}
                square={square}
                isDark={isDarkSquare(square)}
                isSelected={selectedSquare === square}
                isLegalTarget={legalMoves.some((m) => m.to === square)}
                isCaptureTarget={legalMoves.some((m) => m.to === square && m.captured !== undefined)}
                isLastMove={lastMove !== null && (lastMove.from === square || lastMove.to === square)}
                isCheck={checkSquare === square}
                fileLabel={rowIndex === 7 ? file : undefined}
                rankLabel={colIndex === 0 ? rank : undefined}
                labelsHidden={labelsHidden}
                label={squareLabel(square)}
                onClick={onSquareClick}
              />
            )
          }),
        )}
      </Box>
      {/* Keyed by orientation so pieces snap (not glide) to mirrored positions on flip. */}
      <Box key={orientation} sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <AnimatePresence>
          {pieces.map((piece) => (
            <ChessPiece
              key={piece.id}
              piece={piece}
              boardRotation={boardRotation}
              col={squareToCol(piece.square, orientation)}
              row={squareToRow(piece.square, orientation)}
              isElevated={lastMove !== null && lastMove.to === piece.square}
            />
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  )
}

export default ChessBoard
