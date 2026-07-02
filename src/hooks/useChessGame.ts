import { useRef, useState } from 'react'
import { Chess } from 'chess.js'
import type { Color, Move, Square } from 'chess.js'
import type {
  CapturedByColor,
  GameStatus,
  LastMove,
  PendingPromotion,
  PromotionPiece,
  TrackedPiece,
} from '@/types/chess.types'
import { isGameOver } from '@/utils/board'

interface ChessGameState {
  pieces: TrackedPiece[]
  turn: Color
  status: GameStatus
  winner: Color | null
  lastMove: LastMove | null
  selectedSquare: Square | null
  legalMoves: Move[]
  captured: CapturedByColor
  pendingPromotion: PendingPromotion | null
  moveNumber: number
  checkSquare: Square | null
}

export interface ChessGame extends ChessGameState {
  selectSquare: (square: Square) => void
  makeMove: (from: Square, to: Square, promotion?: PromotionPiece) => void
  cancelPromotion: () => void
  reset: () => void
}

const buildPieces = (chess: Chess): TrackedPiece[] =>
  chess
    .board()
    .flat()
    .filter((p) => p !== null)
    .map((p) => ({ id: `${p.color}${p.type}-${p.square}`, type: p.type, color: p.color, square: p.square }))

const deriveStatus = (chess: Chess): GameStatus => {
  if (chess.isCheckmate()) return 'checkmate'
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isDraw()) return 'draw'
  if (chess.inCheck()) return 'check'
  return 'playing'
}

const findKing = (chess: Chess, color: Color): Square | null => {
  const king = chess
    .board()
    .flat()
    .find((p) => p !== null && p.type === 'k' && p.color === color)
  return king ? king.square : null
}

/** Moves piece identities along with the move so animations can follow them. */
const updatePieces = (pieces: TrackedPiece[], move: Move): TrackedPiece[] => {
  let next = pieces

  if (move.captured) {
    // En passant removes the pawn beside the destination, not on it.
    const capturedSquare = move.flags.includes('e')
      ? ((move.to[0] + move.from[1]) as Square)
      : move.to
    next = next.filter((p) => p.square !== capturedSquare)
  }

  next = next.map((p) =>
    p.square === move.from ? { ...p, square: move.to, type: move.promotion ?? p.type } : p,
  )

  const rank = move.from[1]
  if (move.flags.includes('k')) {
    next = next.map((p) => (p.square === `h${rank}` ? { ...p, square: `f${rank}` as Square } : p))
  } else if (move.flags.includes('q')) {
    next = next.map((p) => (p.square === `a${rank}` ? { ...p, square: `d${rank}` as Square } : p))
  }

  return next
}

const createInitialState = (chess: Chess): ChessGameState => ({
  pieces: buildPieces(chess),
  turn: 'w',
  status: 'playing',
  winner: null,
  lastMove: null,
  selectedSquare: null,
  legalMoves: [],
  captured: { w: [], b: [] },
  pendingPromotion: null,
  moveNumber: 1,
  checkSquare: null,
})

const useChessGame = (): ChessGame => {
  const chessRef = useRef<Chess>(null)
  chessRef.current ??= new Chess()
  const [state, setState] = useState<ChessGameState>(() => createInitialState(chessRef.current!))

  const makeMove = (from: Square, to: Square, promotion?: PromotionPiece) => {
    const chess = chessRef.current!
    let move: Move
    try {
      move = chess.move({ from, to, promotion })
    } catch {
      return
    }

    setState((prev) => ({
      ...prev,
      pieces: updatePieces(prev.pieces, move),
      captured: move.captured
        ? { ...prev.captured, [move.color]: [...prev.captured[move.color], move.captured] }
        : prev.captured,
      turn: chess.turn(),
      status: deriveStatus(chess),
      winner: chess.isCheckmate() ? move.color : null,
      lastMove: { from: move.from, to: move.to },
      selectedSquare: null,
      legalMoves: [],
      pendingPromotion: null,
      moveNumber: chess.moveNumber(),
      checkSquare: chess.inCheck() ? findKing(chess, chess.turn()) : null,
    }))
  }

  const selectSquare = (square: Square) => {
    const chess = chessRef.current!
    if (isGameOver(state.status) || state.pendingPromotion) return

    const targetMove = state.selectedSquare
      ? state.legalMoves.find((m) => m.to === square)
      : undefined

    if (targetMove) {
      if (targetMove.promotion) {
        setState((prev) => ({
          ...prev,
          pendingPromotion: { from: targetMove.from, to: targetMove.to, color: targetMove.color },
        }))
      } else {
        makeMove(targetMove.from, targetMove.to)
      }
      return
    }

    const piece = chess.get(square)
    if (piece && piece.color === state.turn && square !== state.selectedSquare) {
      setState((prev) => ({
        ...prev,
        selectedSquare: square,
        legalMoves: chess.moves({ square, verbose: true }),
      }))
    } else {
      setState((prev) => ({ ...prev, selectedSquare: null, legalMoves: [] }))
    }
  }

  const cancelPromotion = () => {
    setState((prev) => ({
      ...prev,
      pendingPromotion: null,
      selectedSquare: null,
      legalMoves: [],
    }))
  }

  const reset = () => {
    chessRef.current = new Chess()
    setState(createInitialState(chessRef.current))
  }

  return { ...state, selectSquare, makeMove, cancelPromotion, reset }
}

export default useChessGame
