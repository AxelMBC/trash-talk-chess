import type { Color, PieceSymbol, Square } from 'chess.js'

export type PlayerColor = Color
export type ScreenName = 'menu' | 'game' | 'scouting'

export type Difficulty = 'easy' | 'medium' | 'hard'

/** How a game screen should run: pass-and-play or against the engine. */
export type GameConfig =
  | { mode: 'local' }
  | { mode: 'computer'; difficulty: Difficulty; playerColor: Color }

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'

export type PromotionPiece = 'q' | 'r' | 'b' | 'n'

/** A piece with a stable identity so it can be animated across squares. */
export interface TrackedPiece {
  id: string
  type: PieceSymbol
  color: Color
  square: Square
}

export interface LastMove {
  from: Square
  to: Square
}

export interface PendingPromotion {
  from: Square
  to: Square
  color: Color
}

/** Pieces captured BY each color (i.e. `w` holds black pieces White has taken). */
export interface CapturedByColor {
  w: PieceSymbol[]
  b: PieceSymbol[]
}
