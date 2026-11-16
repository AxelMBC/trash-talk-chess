import { useCallback, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import type { Color, Move, Square } from 'chess.js'
import type {
  CapturedByColor,
  GameStatus,
  GameView,
  LastMove,
  PendingPromotion,
  PromotionPiece,
  TrackedPiece,
} from '@/types/chess.types'
import { isGameOver, opposite } from '@/utils/board'

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
  moves: Move[]
  viewPly: number | null
  /** Bumped by `reset()`; per-game hooks reset their own state when it changes. */
  gameId: number
}

export interface ChessGame extends ChessGameState {
  selectSquare: (square: Square) => void
  makeMove: (from: Square, to: Square, promotion?: PromotionPiece) => void
  cancelPromotion: () => void
  reset: () => void
  view: GameView
  viewMove: (ply: number) => void
  stepView: (delta: number) => void
  viewLive: () => void
  takeback: (restoreTurnTo: Color) => void
  /** Current position as FEN, for feeding external engines. */
  getFen: () => string
  /** Full detail of the most recent move (flags, SAN, before/after FENs). */
  getLastMove: () => Move | null
  /** Moves so far as PGN movetext, for commentary/analysis consumers. */
  getPgn: () => string
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

const findKing = (pieces: TrackedPiece[], color: Color): Square | null =>
  pieces.find((p) => p.type === 'k' && p.color === color)?.square ?? null

const toLastMove = (move: Move | undefined): LastMove | null =>
  move ? { from: move.from, to: move.to } : null

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

const piecesAt = (moves: Move[], ply: number): TrackedPiece[] =>
  moves.slice(0, ply).reduce(updatePieces, buildPieces(new Chess()))

const capturedFrom = (moves: Move[]): CapturedByColor => {
  const captured: CapturedByColor = { w: [], b: [] }
  for (const move of moves) {
    if (move.captured) captured[move.color].push(move.captured)
  }
  return captured
}

const viewAt = (moves: Move[], ply: number): GameView => {
  const pieces = piecesAt(moves, ply)
  const move = moves[ply - 1]
  const givesCheck = move !== undefined && /[+#]$/.test(move.san)
  return {
    ply,
    isLive: false,
    pieces,
    lastMove: toLastMove(move),
    checkSquare: givesCheck ? findKing(pieces, opposite(move.color)) : null,
  }
}

const derivePosition = (chess: Chess, pieces: TrackedPiece[], moves: Move[]) => ({
  pieces,
  moves,
  turn: chess.turn(),
  status: deriveStatus(chess),
  winner: chess.isCheckmate() ? opposite(chess.turn()) : null,
  lastMove: toLastMove(moves.at(-1)),
  moveNumber: chess.moveNumber(),
  checkSquare: chess.inCheck() ? findKing(pieces, chess.turn()) : null,
  selectedSquare: null,
  legalMoves: [],
  pendingPromotion: null,
  viewPly: null,
})

const createInitialState = (chess: Chess, gameId: number): ChessGameState => ({
  ...derivePosition(chess, buildPieces(chess), []),
  captured: { w: [], b: [] },
  gameId,
})

const clampPly = (ply: number, moveCount: number): number => Math.min(Math.max(ply, 0), moveCount)

const useChessGame = (): ChessGame => {
  const chessRef = useRef<Chess>(null)
  chessRef.current ??= new Chess()
  const [state, setState] = useState<ChessGameState>(() => createInitialState(chessRef.current!, 0))

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
      ...derivePosition(chess, updatePieces(prev.pieces, move), [...prev.moves, move]),
      captured: move.captured
        ? { ...prev.captured, [move.color]: [...prev.captured[move.color], move.captured] }
        : prev.captured,
    }))
  }

  const takeback = (restoreTurnTo: Color) => {
    const chess = chessRef.current!
    const plies = chess.turn() === restoreTurnTo ? 2 : 1
    if (state.moves.at(-plies)?.color !== restoreTurnTo) return
    for (let undone = 0; undone < plies; undone++) chess.undo()

    setState((prev) => {
      const moves = prev.moves.slice(0, -plies)
      return {
        ...prev,
        ...derivePosition(chess, piecesAt(moves, moves.length), moves),
        captured: capturedFrom(moves),
      }
    })
  }

  const viewMove = useCallback((ply: number) => {
    setState((prev) => {
      const target = clampPly(ply, prev.moves.length)
      const viewPly = target === prev.moves.length ? null : target
      if (viewPly === prev.viewPly) return prev
      return { ...prev, viewPly, selectedSquare: null, legalMoves: [] }
    })
  }, [])

  const stepView = useCallback((delta: number) => {
    setState((prev) => {
      const target = clampPly((prev.viewPly ?? prev.moves.length) + delta, prev.moves.length)
      const viewPly = target === prev.moves.length ? null : target
      if (viewPly === prev.viewPly) return prev
      return { ...prev, viewPly, selectedSquare: null, legalMoves: [] }
    })
  }, [])

  const viewLive = useCallback(() => viewMove(Number.POSITIVE_INFINITY), [viewMove])

  const selectSquare = (square: Square) => {
    const chess = chessRef.current!
    if (isGameOver(state.status) || state.pendingPromotion || state.viewPly !== null) return

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
    const chess = chessRef.current
    setState((prev) => createInitialState(chess, prev.gameId + 1))
  }

  const getFen = () => chessRef.current!.fen()

  const getLastMove = () => state.moves.at(-1) ?? null

  const getPgn = () => chessRef.current!.pgn()

  const { moves, viewPly, pieces, lastMove, checkSquare } = state
  const view = useMemo<GameView>(
    () =>
      viewPly === null
        ? { ply: moves.length, isLive: true, pieces, lastMove, checkSquare }
        : viewAt(moves, viewPly),
    [moves, viewPly, pieces, lastMove, checkSquare],
  )

  return {
    ...state,
    selectSquare,
    makeMove,
    cancelPromotion,
    reset,
    view,
    viewMove,
    stepView,
    viewLive,
    takeback,
    getFen,
    getLastMove,
    getPgn,
  }
}

export default useChessGame
