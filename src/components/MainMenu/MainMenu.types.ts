export interface MainMenuProps {
  onPlayLocal: () => void
  onScout: (username: string) => void
}

export interface FloatingPieceConfig {
  image: string
  size: number
  top: string
  left: string
  duration: number
  delay: number
  opacity: number
}
