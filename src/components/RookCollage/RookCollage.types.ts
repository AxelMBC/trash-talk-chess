export type CollageTone = 'loud' | 'quiet'

export interface RookCollageProps {
  tone?: CollageTone
}

export interface CollageToneColors {
  fills: readonly string[]
  edge: string
  outline: string
  shadow: string
  shade: { ellipse: string; center: number; middle: number; rim: number }
}

export interface RookSticker {
  id: string
  /** Uniform draw in [0, 1) that picks the fill from the tone's palette. */
  fillPick: number
  transform: string
  shadowTransform: string
}
