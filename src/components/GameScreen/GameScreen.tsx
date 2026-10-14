import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import type { Color, Square } from 'chess.js'
import { AnimatePresence, motion } from 'motion/react'
import useChessGame from '@/hooks/useChessGame'
import useEngineOpponent from '@/hooks/useEngineOpponent'
import useTableTurn from '@/hooks/useTableTurn'
import useTrashTalk from '@/hooks/useTrashTalk'
import ChessBoard from '@/components/ChessBoard'
import TrashTalkBubble from '@/components/TrashTalkBubble'
import GameStatusBar from '@/components/GameStatusBar'
import CapturedPieces from '@/components/CapturedPieces'
import PromotionDialog from '@/components/PromotionDialog'
import GameOverOverlay from '@/components/GameOverOverlay'
import EngineErrorOverlay from '@/components/EngineErrorOverlay'
import RookCollage from '@/components/RookCollage'
import { STICKER_COLORS } from '@/theme/theme'
import { STICKER_RADIUS, stickerButtonSx } from '@/theme/sticker'
import { colorName, isGameOver } from '@/utils/board'
import { DIFFICULTY_LABELS } from '@/utils/difficulty'
import type { GameScreenProps } from './GameScreen.types'

const ENGINE_NAME = 'Stockfish'
const BOARD_SHADOW_OFFSET_PX = 8

const GameScreen = ({ config, onExitToMenu }: GameScreenProps) => {
  const game = useChessGame()
  const isComputer = config.mode === 'computer'
  const playerColor: Color = isComputer ? config.playerColor : 'w'
  const engineColor: Color = playerColor === 'w' ? 'b' : 'w'
  const engine = useEngineOpponent(game, {
    enabled: isComputer,
    difficulty: isComputer ? config.difficulty : 'medium',
    engineColor,
  })
  const trashTalk = useTrashTalk(game, {
    enabled: isComputer,
    difficulty: isComputer ? config.difficulty : 'medium',
    playerColor,
    engineStatus: engine.engineStatus,
    lastReport: engine.lastReport,
  })
  // The table-turn is a pass-and-play ritual; vs the computer the board
  // stays fixed toward the human player for the whole game.
  const { orientation, isTurning, boardRotation, boardScale, boardTilt } = useTableTurn(game, {
    enabled: !isComputer,
    homeOrientation: playerColor,
  })
  const gameOver = isGameOver(game.status)
  /** vs computer: the human can only act on their own turn with a live engine. */
  const engineBlocksInput =
    isComputer && (game.turn !== playerColor || engine.engineStatus !== 'idle')

  const engineActivity =
    !gameOver && (engine.engineStatus === 'loading' || engine.engineStatus === 'thinking')
      ? engine.engineStatus
      : null
  const enginePlateName = isComputer ? `${ENGINE_NAME} · ${DIFFICULTY_LABELS[config.difficulty]}` : null
  const topColor: Color = orientation === 'w' ? 'b' : 'w'

  const plateName = (color: Color): string => {
    if (enginePlateName === null) return colorName(color)
    return color === engineColor ? enginePlateName : 'You'
  }

  const handleSquareClick = (square: Square) => {
    if (isTurning || engineBlocksInput) return
    game.selectSquare(square)
  }

  const handleRematch = () => game.reset()

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        py: 2.5,
        px: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <RookCollage tone="quiet" />

      <Box
        sx={{
          position: 'relative',
          width: 'min(94vw, 66dvh, 620px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
        }}
      >
        <GameStatusBar
          turn={game.turn}
          status={game.status}
          moveNumber={game.moveNumber}
          perspective={isComputer ? { mode: 'computer', playerColor, engineName: ENGINE_NAME } : { mode: 'local' }}
          onExitToMenu={onExitToMenu}
        />

        <CapturedPieces
          color={topColor}
          captured={game.captured}
          name={plateName(topColor)}
          activity={topColor === engineColor ? engineActivity : null}
        />

        {/* The engine's mouth. Reserved slot (fixed height) so lines never shift the board. */}
        {isComputer && (
          <TrashTalkBubble line={engine.engineStatus === 'error' ? null : trashTalk.line} />
        )}

        <Box sx={{ perspective: '1400px' }}>
          {/* Lift layer: scale + tilt + shadow. Never rotates, so the light direction stays put;
              drop-shadow traces the rotated board's alpha, where box-shadow would stay an upright square. */}
          <motion.div
            style={{
              scale: boardScale,
              rotateX: boardTilt,
              borderRadius: STICKER_RADIUS,
              filter: `drop-shadow(${BOARD_SHADOW_OFFSET_PX}px ${BOARD_SHADOW_OFFSET_PX}px 0 ${STICKER_COLORS.ink})`,
            }}
          >
            {/* Orbit layer: the in-plane table turn. */}
            <motion.div style={{ rotate: boardRotation }}>
              <ChessBoard
                pieces={game.pieces}
                orientation={orientation}
                boardRotation={boardRotation}
                labelsHidden={isTurning}
                selectedSquare={game.selectedSquare}
                legalMoves={game.selectedSquare ? game.legalMoves : []}
                lastMove={game.lastMove}
                checkSquare={game.checkSquare}
                disabled={isTurning || gameOver || engineBlocksInput}
                onSquareClick={handleSquareClick}
              />
            </motion.div>
          </motion.div>
        </Box>

        <CapturedPieces
          color={orientation}
          captured={game.captured}
          name={plateName(orientation)}
          activity={orientation === engineColor ? engineActivity : null}
        />

        <Button
          variant="contained"
          onClick={handleRematch}
          sx={{ ...stickerButtonSx(STICKER_COLORS.paper, { size: 'small' }), alignSelf: 'center', mt: 0.5 }}
        >
          New game
        </Button>
      </Box>

      <PromotionDialog
        promotion={game.pendingPromotion}
        onSelect={(piece) => {
          if (game.pendingPromotion) {
            game.makeMove(game.pendingPromotion.from, game.pendingPromotion.to, piece)
          }
        }}
        onCancel={game.cancelPromotion}
      />

      <AnimatePresence>
        {gameOver && (
          <GameOverOverlay
            status={game.status}
            winner={game.winner}
            onRematch={handleRematch}
            onMenu={onExitToMenu}
          />
        )}
      </AnimatePresence>

      {/* Engine trouble is terminal for the game: surface it, offer the exit. */}
      <AnimatePresence>
        {engine.engineStatus === 'error' && !gameOver && (
          <EngineErrorOverlay
            key="engine-error"
            message={engine.engineError?.message}
            onMenu={onExitToMenu}
          />
        )}
      </AnimatePresence>
    </Box>
  )
}

export default GameScreen
