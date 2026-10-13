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
import { isGameOver } from '@/utils/board'
import type { GameScreenProps } from './GameScreen.types'

/** Must match the board's border radius (sx borderRadius: 2 → 28px) so shadows hug it. */
const BOARD_RADIUS_PX = 28

const GameScreen = ({ config, onExitToMenu }: GameScreenProps) => {
  const game = useChessGame()
  const isComputer = config.mode === 'computer'
  const playerColor: Color = isComputer ? config.playerColor : 'w'
  const engine = useEngineOpponent(game, {
    enabled: isComputer,
    difficulty: isComputer ? config.difficulty : 'medium',
    engineColor: playerColor === 'w' ? 'b' : 'w',
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
        background:
          'radial-gradient(1000px 600px at 50% -20%, rgba(245, 185, 66, 0.08), transparent 60%), #0b0e14',
      }}
    >
      <Box
        sx={{
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
          engineActivity={
            !gameOver && (engine.engineStatus === 'loading' || engine.engineStatus === 'thinking')
              ? engine.engineStatus
              : null
          }
        />

        <CapturedPieces color={orientation === 'w' ? 'b' : 'w'} captured={game.captured} />

        {/* The engine's mouth. Reserved slot (fixed height) so lines never shift the board. */}
        {isComputer && (
          <TrashTalkBubble line={engine.engineStatus === 'error' ? null : trashTalk.line} />
        )}

        <Box sx={{ perspective: '1400px' }}>
          {/* Lift layer: scale + tilt + shadow. Never rotates, so the light direction stays put. */}
          <motion.div
            style={{
              scale: boardScale,
              rotateX: boardTilt,
              borderRadius: BOARD_RADIUS_PX,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.06)',
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

        <CapturedPieces color={orientation} captured={game.captured} />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 0.5 }}>
          <Button color="inherit" size="small" onClick={onExitToMenu} sx={{ opacity: 0.7 }}>
            ← Menu
          </Button>
          <Button color="inherit" size="small" onClick={handleRematch} sx={{ opacity: 0.7 }}>
            ↺ New game
          </Button>
        </Box>
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
