import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import MainMenu from '@/components/MainMenu'
import GameScreen from '@/components/GameScreen'
import ScoutingReport from '@/components/ScoutingReport'
import type { ScreenName } from '@/types/chess.types'

const App = () => {
  const [screen, setScreen] = useState<ScreenName>('menu')
  const [scoutUsername, setScoutUsername] = useState('')

  return (
    <AnimatePresence mode="wait">
      {screen === 'menu' ? (
        <motion.div
          key="menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.3 }}
        >
          <MainMenu
            onPlayLocal={() => setScreen('game')}
            onScout={(username) => {
              setScoutUsername(username)
              setScreen('scouting')
            }}
          />
        </motion.div>
      ) : screen === 'scouting' ? (
        <motion.div
          key="scouting"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ScoutingReport username={scoutUsername} onExitToMenu={() => setScreen('menu')} />
        </motion.div>
      ) : (
        <motion.div
          key="game"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GameScreen onExitToMenu={() => setScreen('menu')} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default App
