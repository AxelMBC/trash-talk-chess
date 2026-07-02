import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import type { Color, Square } from 'chess.js'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import type { Transition } from 'motion/react'
import useChessGame from '@/hooks/useChessGame'
import ChessBoard from '@/components/ChessBoard'
import GameStatusBar from '@/components/GameStatusBar'
import CapturedPieces from '@/components/CapturedPieces'
import PromotionDialog from '@/components/PromotionDialog'
import GameOverOverlay from '@/components/GameOverOverlay'
import { isGameOver } from '@/utils/board'
import type { GameScreenProps } from './GameScreen.types'

/** How long piece glide gets to finish before the board starts turning. */
const FLIP_DELAY_MS = 420
const FLIP_HALF_TURN: Transition = { duration: 0.32, ease: [0.55, 0, 1, 0.45] }
const FLIP_SETTLE: Transition = { duration: 0.34, ease: [0, 0.55, 0.45, 1] }

const GameScreen = ({ onExitToMenu }: GameScreenProps) => {
  const game = useChessGame()
  const [orientation, setOrientation] = useState<Color>('w')
  const [isFlipping, setIsFlipping] = useState(false)
  const flipControls = useAnimationControls()
  const reduceMotion = useReducedMotion()
  const prevTurnRef = useRef<Color>('w')
  const gameOver = isGameOver(game.status)

  useEffect(() => {
    if (game.turn === prevTurnRef.current) return
    prevTurnRef.current = game.turn
    if (isGameOver(game.status)) return

    let cancelled = false
    setIsFlipping(true)

    const flip = async () => {
      await new Promise((resolve) => setTimeout(resolve, FLIP_DELAY_MS))
      if (cancelled) return
      if (reduceMotion) {
        setOrientation(game.turn)
        setIsFlipping(false)
        return
      }
      await flipControls.start({ rotateY: 90, transition: FLIP_HALF_TURN })
      if (cancelled) return
      setOrientation(game.turn)
      flipControls.set({ rotateY: -90 })
      await flipControls.start({ rotateY: 0, transition: FLIP_SETTLE })
      if (cancelled) return
      setIsFlipping(false)
    }
    void flip()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.turn])

  const handleSquareClick = (square: Square) => {
    if (isFlipping) return
    game.selectSquare(square)
  }

  const handleRematch = () => {
    game.reset()
    prevTurnRef.current = 'w'
    setOrientation('w')
    setIsFlipping(false)
    flipControls.set({ rotateY: 0 })
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
        <GameStatusBar turn={game.turn} status={game.status} moveNumber={game.moveNumber} />

        <CapturedPieces color={orientation === 'w' ? 'b' : 'w'} captured={game.captured} />

        <Box sx={{ perspective: '1400px' }}>
          <motion.div initial={false} animate={flipControls} style={{ transformStyle: 'preserve-3d' }}>
            <ChessBoard
              pieces={game.pieces}
              orientation={orientation}
              selectedSquare={game.selectedSquare}
              legalMoves={game.selectedSquare ? game.legalMoves : []}
              lastMove={game.lastMove}
              checkSquare={game.checkSquare}
              disabled={isFlipping || gameOver}
              onSquareClick={handleSquareClick}
            />
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
    </Box>
  )
}

export default GameScreen
