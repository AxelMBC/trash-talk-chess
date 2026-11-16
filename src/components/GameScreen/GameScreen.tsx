import { useEffect, useState } from 'react'
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
import ConfirmDialog from '@/components/ConfirmDialog'
import MoveList from '@/components/MoveList'
import GameOverOverlay from '@/components/GameOverOverlay'
import EngineErrorOverlay from '@/components/EngineErrorOverlay'
import RookCollage from '@/components/RookCollage'
import { STICKER_COLORS } from '@/theme/theme'
import { STICKER_RADIUS, stickerButtonSx } from '@/theme/sticker'
import { ENGINE_NAME } from '@/services/engine'
import { colorName, isGameOver, opposite } from '@/utils/board'
import { DIFFICULTY_LABELS } from '@/utils/difficulty'
import type { GameScreenProps } from './GameScreen.types'

const BOARD_SHADOW_OFFSET_PX = 8

type DiscardAction = 'reset' | 'exit'

const isTextField = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

const GameScreen = ({ config, onExitToMenu }: GameScreenProps) => {
  const game = useChessGame()
  const isComputer = config.mode === 'computer'
  const playerColor: Color = isComputer ? config.playerColor : 'w'
  const engineColor: Color = opposite(playerColor)
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
  const [pendingDiscard, setPendingDiscard] = useState<DiscardAction | null>(null)
  const gameOver = isGameOver(game.status)
  const { view, stepView } = game
  /** vs computer: the human can only act on their own turn with a live engine. */
  const engineBlocksInput =
    isComputer && (game.turn !== playerColor || engine.engineStatus !== 'idle')

  const engineActivity =
    !gameOver && (engine.engineStatus === 'loading' || engine.engineStatus === 'thinking')
      ? engine.engineStatus
      : null
  const enginePlateName = isComputer ? `${ENGINE_NAME} · ${DIFFICULTY_LABELS[config.difficulty]}` : null
  const topColor: Color = opposite(orientation)

  const plateName = (color: Color): string => {
    if (enginePlateName === null) return colorName(color)
    return color === engineColor ? enginePlateName : 'You'
  }

  const canTakeback =
    isComputer &&
    game.turn === playerColor &&
    engine.engineStatus === 'idle' &&
    !gameOver &&
    view.isLive &&
    game.moves.some((move) => move.color === playerColor)

  const viewKeysBlocked = isTurning || game.pendingPromotion !== null || pendingDiscard !== null

  useEffect(() => {
    if (viewKeysBlocked) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (isTextField(event.target)) return
      if (event.key === 'ArrowLeft') stepView(-1)
      else if (event.key === 'ArrowRight') stepView(1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewKeysBlocked, stepView])

  const handleSquareClick = (square: Square) => {
    if (isTurning || engineBlocksInput) return
    game.selectSquare(square)
  }

  const runDiscard = (action: DiscardAction) => {
    if (action === 'reset') game.reset()
    else onExitToMenu()
  }

  const requestDiscard = (action: DiscardAction) => {
    const hasGameInProgress = game.moves.length > 0 && !gameOver
    if (hasGameInProgress) setPendingDiscard(action)
    else runDiscard(action)
  }

  const handleConfirmDiscard = () => {
    if (pendingDiscard === null) return
    setPendingDiscard(null)
    runDiscard(pendingDiscard)
  }

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
          onExitToMenu={() => requestDiscard('exit')}
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
                pieces={view.pieces}
                orientation={orientation}
                boardRotation={boardRotation}
                labelsHidden={isTurning}
                selectedSquare={game.selectedSquare}
                legalMoves={game.selectedSquare ? game.legalMoves : []}
                lastMove={view.lastMove}
                checkSquare={view.checkSquare}
                disabled={isTurning || gameOver || engineBlocksInput || !view.isLive}
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

        <MoveList
          moves={game.moves}
          viewPly={view.ply}
          isLive={view.isLive}
          disabled={isTurning}
          onViewMove={game.viewMove}
          onStepView={stepView}
          onViewLive={game.viewLive}
        />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 0.5 }}>
          {isComputer && (
            <Button
              variant="contained"
              disabled={!canTakeback}
              onClick={() => game.takeback(playerColor)}
              sx={stickerButtonSx(STICKER_COLORS.paper, { size: 'small' })}
            >
              Takeback
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => requestDiscard('reset')}
            sx={stickerButtonSx(STICKER_COLORS.paper, { size: 'small' })}
          >
            New game
          </Button>
        </Box>
      </Box>

      <ConfirmDialog
        open={pendingDiscard !== null}
        title="Ditch this game?"
        message="The game in progress will be lost."
        confirmLabel="Ditch it"
        cancelLabel="Keep playing"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setPendingDiscard(null)}
      />

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
            onRematch={game.reset}
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
