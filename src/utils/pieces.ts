import type { Color, PieceSymbol } from 'chess.js'
import wK from '@/assets/pieces/wK.svg'
import wQ from '@/assets/pieces/wQ.svg'
import wR from '@/assets/pieces/wR.svg'
import wB from '@/assets/pieces/wB.svg'
import wN from '@/assets/pieces/wN.svg'
import wP from '@/assets/pieces/wP.svg'
import bK from '@/assets/pieces/bK.svg'
import bQ from '@/assets/pieces/bQ.svg'
import bR from '@/assets/pieces/bR.svg'
import bB from '@/assets/pieces/bB.svg'
import bN from '@/assets/pieces/bN.svg'
import bP from '@/assets/pieces/bP.svg'

export const PIECE_IMAGES: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: wK, q: wQ, r: wR, b: wB, n: wN, p: wP },
  b: { k: bK, q: bQ, r: bR, b: bB, n: bN, p: bP },
}

export const PIECE_NAMES: Record<PieceSymbol, string> = {
  k: 'King',
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
  p: 'Pawn',
}

/** Standard material values, used for the captured-pieces advantage readout. */
export const PIECE_VALUES: Record<PieceSymbol, number> = {
  k: 0,
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
}
