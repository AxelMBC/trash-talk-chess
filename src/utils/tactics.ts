import { Chess } from 'chess.js'
import type { Move, PieceSymbol } from 'chess.js'

/**
 * Detects crowd-pleasing events in a just-played move so trash talk can react
 * to the specific thing that happened instead of a generic quality verdict.
 * Works on a scratch Chess instance built from the move's `after` FEN — never
 * the live game engine.
 */
export type MoveEvent = 'fork' | 'promotion' | 'check' | 'capture'

/** When several events apply, the most specific (and funniest) one wins. */
export const EVENT_PRIORITY: readonly MoveEvent[] = ['fork', 'promotion', 'check', 'capture']

const PIECE_VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }

/**
 * Fork: the moved piece now attacks two or more enemy pieces that are each
 * worth more than it or left undefended — i.e. threats the opponent cannot
 * answer all at once.
 */
const isFork = (move: Move): boolean => {
  const chess = new Chess(move.after)
  const mover = move.promotion ?? move.piece
  let targets = 0
  for (const piece of chess.board().flat()) {
    if (!piece || piece.color === move.color) continue
    if (!chess.attackers(piece.square, move.color).includes(move.to)) continue
    const defended = chess.attackers(piece.square, piece.color).length > 0
    if (PIECE_VALUE[piece.type] > PIECE_VALUE[mover] || !defended) targets++
    if (targets >= 2) return true
  }
  return false
}

/** Highest-priority event the move triggers, or null for a quiet move. */
export const detectEvent = (move: Move): MoveEvent | null => {
  const matches: Record<MoveEvent, boolean> = {
    fork: isFork(move),
    promotion: move.promotion !== undefined,
    check: move.san.includes('+'),
    capture: move.captured !== undefined,
  }
  return EVENT_PRIORITY.find((event) => matches[event]) ?? null
}
