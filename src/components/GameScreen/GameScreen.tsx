import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { Color, Square } from 'chess.js'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from 'motion/react'
import type { AnimationPlaybackControls } from 'motion/react'
import useChessGame from '@/hooks/useChessGame'
import useEngineOpponent from '@/hooks/useEngineOpponent'
import ChessBoard from '@/components/ChessBoard'
import GameStatusBar from '@/components/GameStatusBar'
import CapturedPieces from '@/components/CapturedPieces'
import PromotionDialog from '@/components/PromotionDialog'
import GameOverOverlay from '@/components/GameOverOverlay'
import { isGameOver } from '@/utils/board'
import type { GameScreenProps } from './GameScreen.types'

/** Overlap window: the orbit starts gently while the moved piece finishes its glide. */
const TURN_DELAY_MS = 200
/** Scale the board drops to while "lifted off the table" during the turn. */
const LIFT_SCALE = 0.94
/** 3D tilt (degrees) applied with the lift, flattened back out on settle. */
const LIFT_TILT_DEG = 8
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
  const [orientation, setOrientation] = useState<Color>(playerColor)
  const [isTurning, setIsTurning] = useState(false)
  const boardRotation = useMotionValue(0)
  const boardScale = useMotionValue(1)
  const boardTilt = useMotionValue(0)
  const reduceMotion = useReducedMotion()
  const prevTurnRef = useRef<Color>('w')
  const gameOver = isGameOver(game.status)
  /** vs computer: the human can only act on their own turn with a live engine. */
  const engineBlocksInput =
    isComputer && (game.turn !== playerColor || engine.engineStatus !== 'idle')

  useEffect(() => {
    // The table-turn is a pass-and-play ritual; vs the computer the board
    // stays fixed toward the human player for the whole game.
    if (isComputer) return
    if (game.turn === prevTurnRef.current) return
    prevTurnRef.current = game.turn
    if (isGameOver(game.status)) return

    let cancelled = false
    const controls: AnimationPlaybackControls[] = []
    setIsTurning(true)

    const turnTable = async () => {
      await new Promise((resolve) => setTimeout(resolve, TURN_DELAY_MS))
      if (cancelled) return
      if (reduceMotion) {
        setOrientation(game.turn)
        setIsTurning(false)
        return
      }
      // Lift: the board comes slightly off the table as the orbit begins.
      controls.push(
        animate(boardScale, LIFT_SCALE, { duration: 0.18, ease: 'easeOut' }),
        animate(boardTilt, LIFT_TILT_DEG, { duration: 0.18, ease: 'easeOut' }),
      )
      // Orbit: one continuous in-plane half turn, decelerating into place.
      const orbit = animate(boardRotation, 180, { duration: 0.52, ease: [0.45, 0, 0.15, 1] })
      controls.push(orbit)
      await orbit
      if (cancelled) return
      // A board rotated 180° is pixel-identical to the swapped orientation at 0°,
      // so committing both in the same paint makes the state swap invisible.
      // Reset the rotation FIRST: the piece layer remounts on the orientation swap,
      // and its counter-rotations must initialize from 0, not the stale 180.
      boardRotation.jump(0)
      flushSync(() => setOrientation(game.turn))
      // Settle: back down onto the table with a bit of spring.
      const settle = [
        animate(boardScale, 1, { type: 'spring', stiffness: 320, damping: 22 }),
        animate(boardTilt, 0, { type: 'spring', stiffness: 320, damping: 22 }),
      ]
      controls.push(...settle)
      await Promise.all(settle)
      if (cancelled) return
      setIsTurning(false)
    }
    void turnTable()

    return () => {
      cancelled = true
      controls.forEach((control) => control.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.turn])

  const handleSquareClick = (square: Square) => {
    if (isTurning || engineBlocksInput) return
    game.selectSquare(square)
  }

  const handleRematch = () => {
    game.reset()
    engine.startNewGame()
    prevTurnRef.current = 'w'
    setOrientation(playerColor)
    setIsTurning(false)
    boardRotation.jump(0)
    boardScale.jump(1)
    boardTilt.jump(0)
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
          <motion.div
            key="engine-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(11, 14, 20, 0.82)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <Box
              sx={{
                maxWidth: 420,
                mx: 2,
                px: 4,
                py: 3.5,
                textAlign: 'center',
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                The engine flipped the table
              </Typography>
              <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                {engine.engineError?.message ?? 'The chess engine ran into a problem.'}
              </Typography>
              <Button variant="contained" onClick={onExitToMenu}>
                ← Back to menu
              </Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}

export default GameScreen
