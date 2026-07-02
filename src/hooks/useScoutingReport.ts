import { useCallback, useRef, useState } from 'react'
import { collectRecentGames, fetchProfile, fetchStats } from '@/services/chesscom'
import type { CollectProgress, ScoutError } from '@/services/chesscom'
import { buildDossier, loadCachedDossier, saveDossier } from '@/services/dossier'
import type { PlayerDossier } from '@/types/dossier.types'

export type ScoutingState =
  | { phase: 'idle' }
  | { phase: 'loading'; username: string; progress: CollectProgress | null }
  | { phase: 'ready'; dossier: PlayerDossier; fromCache: boolean }
  | { phase: 'error'; username: string; error: ScoutError }

export interface ScoutingReport {
  state: ScoutingState
  /** Cache-first: a valid cached dossier renders immediately with no network. */
  scout: (username: string) => void
  /** Bypasses the cache, refetches, and overwrites the cached dossier. */
  rescout: () => void
}

const useScoutingReport = (): ScoutingReport => {
  const [state, setState] = useState<ScoutingState>({ phase: 'idle' })
  const busyRef = useRef(false)
  const lastUsernameRef = useRef<string | null>(null)

  const runScout = useCallback(async (rawUsername: string, bypassCache: boolean) => {
    const username = rawUsername.trim()
    if (!username || busyRef.current) return
    lastUsernameRef.current = username

    if (!bypassCache) {
      const cached = loadCachedDossier(username)
      if (cached) {
        setState({ phase: 'ready', dossier: cached, fromCache: true })
        return
      }
    }

    busyRef.current = true
    setState({ phase: 'loading', username, progress: null })

    try {
      const profile = await fetchProfile(username)
      if (!profile.ok) {
        setState({ phase: 'error', username, error: profile.error })
        return
      }

      const stats = await fetchStats(username)
      if (!stats.ok) {
        setState({ phase: 'error', username, error: stats.error })
        return
      }

      const games = await collectRecentGames(username, 100, (progress) => {
        setState((prev) => (prev.phase === 'loading' ? { ...prev, progress } : prev))
      })
      if (!games.ok) {
        setState({ phase: 'error', username, error: games.error })
        return
      }

      const dossier = buildDossier(username, profile.value, stats.value, games.value)
      saveDossier(dossier)
      setState({ phase: 'ready', dossier, fromCache: false })
    } finally {
      busyRef.current = false
    }
  }, [])

  const scout = useCallback((username: string) => void runScout(username, false), [runScout])

  const rescout = useCallback(() => {
    if (lastUsernameRef.current) void runScout(lastUsernameRef.current, true)
  }, [runScout])

  return { state, scout, rescout }
}

export default useScoutingReport
