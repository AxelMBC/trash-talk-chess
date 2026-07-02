import { createTheme } from '@mui/material/styles'

/** Board-specific colors that live outside the MUI palette. */
export const BOARD_COLORS = {
  lightSquare: '#f0d9b5',
  darkSquare: '#b58863',
  selected: 'rgba(255, 196, 0, 0.55)',
  lastMove: 'rgba(155, 199, 0, 0.42)',
  legalDot: 'rgba(20, 24, 30, 0.35)',
  captureRing: 'rgba(20, 24, 30, 0.35)',
  check: 'rgba(232, 55, 55, 0.85)',
} as const

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f5b942',
      contrastText: '#171410',
    },
    secondary: {
      main: '#4dd6c1',
    },
    background: {
      default: '#0b0e14',
      paper: '#141926',
    },
    text: {
      primary: '#eef1f6',
      secondary: '#9aa3b5',
    },
    error: {
      main: '#e83737',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

export default theme
