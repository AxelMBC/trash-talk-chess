import type { Color, Square } from 'chess.js'
import type { GameStatus } from '@/types/chess.types'

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

/** Files left-to-right as seen from the given player's perspective. */
export const orientedFiles = (orientation: Color): string[] =>
  orientation === 'w' ? [...FILES] : [...FILES].reverse()

/** Ranks top-to-bottom as seen from the given player's perspective. */
export const orientedRanks = (orientation: Color): string[] =>
  orientation === 'w' ? [...RANKS].reverse() : [...RANKS]

export const isDarkSquare = (square: Square): boolean => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = square.charCodeAt(1) - '1'.charCodeAt(0)
  return (file + rank) % 2 === 0
}

/** Visual column (0-7, left to right) of a square for the given orientation. */
export const squareToCol = (square: Square, orientation: Color): number => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  return orientation === 'w' ? file : 7 - file
}

/** Visual row (0-7, top to bottom) of a square for the given orientation. */
export const squareToRow = (square: Square, orientation: Color): number => {
  const rank = square.charCodeAt(1) - '1'.charCodeAt(0)
  return orientation === 'w' ? 7 - rank : rank
}

export const isGameOver = (status: GameStatus): boolean =>
  status === 'checkmate' || status === 'stalemate' || status === 'draw'

export const colorName = (color: Color): string => (color === 'w' ? 'White' : 'Black')
