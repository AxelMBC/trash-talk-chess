import { useCallback, useEffect, useRef, useState } from 'react'
import { collectRecentGames, fetchProfile, fetchStats } from '@/services/chesscom'
import type { CollectProgress, ScoutError } from '@/services/chesscom'
import { buildDossier, loadCachedDossier, saveDossier } from '@/services/dossier'
import { rememberScoutedPlayer } from '@/services/playerBrief'
import type { PlayerDossier } from '@/types/dossier.types'

export type ScoutingStage = 'profile' | 'ratings' | 'games'

export type ScoutingState =
  | { phase: 'idle' }
  | { phase: 'loading'; username: string; stage: ScoutingStage; progress: CollectProgress | null }
  | { phase: 'ready'; dossier: PlayerDossier; fromCache: boolean }
  | { phase: 'error'; username: string; error: ScoutError }

export interface ScoutingReport {
  state: ScoutingState
  /** Cache-first: a valid cached dossier renders immediately with no network. */
  scout: (username: string) => void
  /** Bypasses the cache, refetches, and overwrites the cached dossier. */
  rescout: () => void
  /** Abandons the scout in flight: it never saves, remembers the player or updates state. */
  cancel: () => void
}

const useScoutingReport = (): ScoutingReport => {
  const [state, setState] = useState<ScoutingState>({ phase: 'idle' })
  const activeScoutRef = useRef<AbortController | null>(null)
  const lastUsernameRef = useRef<string | null>(null)

  const cancel = useCallback(() => {
    activeScoutRef.current?.abort()
    activeScoutRef.current = null
  }, [])

  useEffect(() => cancel, [cancel])

  const runScout = useCallback(async (rawUsername: string, bypassCache: boolean) => {
    const username = rawUsername.trim()
    if (!username || activeScoutRef.current) return
    lastUsernameRef.current = username

    if (!bypassCache) {
      const cached = loadCachedDossier(username)
      if (cached) {
        rememberScoutedPlayer(cached.username)
        setState({ phase: 'ready', dossier: cached, fromCache: true })
        return
      }
    }

    const controller = new AbortController()
    const { signal } = controller
    activeScoutRef.current = controller
    setState({ phase: 'loading', username, stage: 'profile', progress: null })

    const advanceTo = (stage: ScoutingStage) => {
      setState((prev) => (prev.phase === 'loading' ? { ...prev, stage } : prev))
    }

    try {
      const profile = await fetchProfile(username, signal)
      if (signal.aborted) return
      if (!profile.ok) {
        setState({ phase: 'error', username, error: profile.error })
        return
      }

      advanceTo('ratings')
      const stats = await fetchStats(username, signal)
      if (signal.aborted) return
      if (!stats.ok) {
        setState({ phase: 'error', username, error: stats.error })
        return
      }

      advanceTo('games')
      const games = await collectRecentGames(
        username,
        100,
        (progress) => {
          setState((prev) => (prev.phase === 'loading' ? { ...prev, progress } : prev))
        },
        signal,
      )
      if (signal.aborted) return
      if (!games.ok) {
        setState({ phase: 'error', username, error: games.error })
        return
      }

      const dossier = buildDossier(username, profile.value, stats.value, games.value)
      saveDossier(dossier)
      rememberScoutedPlayer(dossier.username)
      setState({ phase: 'ready', dossier, fromCache: false })
    } finally {
      if (activeScoutRef.current === controller) activeScoutRef.current = null
    }
  }, [])

  const scout = useCallback((username: string) => void runScout(username, false), [runScout])

  const rescout = useCallback(() => {
    if (lastUsernameRef.current) void runScout(lastUsernameRef.current, true)
  }, [runScout])

  return { state, scout, rescout, cancel }
}

export default useScoutingReport
