const API_BASE = 'https://api.chess.com/pub'

export interface ChessComProfile {
  username: string
  joined: number
  last_online: number
  status: string
  avatar?: string
  name?: string
}

export interface ChessComStatsBlock {
  last: { rating: number }
  best?: { rating: number }
  record: { win: number; loss: number; draw: number }
}

export interface ChessComStats {
  chess_rapid?: ChessComStatsBlock
  chess_blitz?: ChessComStatsBlock
  chess_bullet?: ChessComStatsBlock
  chess_daily?: ChessComStatsBlock
}

export interface ChessComGamePlayer {
  username: string
  rating: number
  result: string
}

export interface ChessComGame {
  url: string
  pgn?: string
  time_control: string
  time_class: string
  rules: string
  rated: boolean
  end_time: number
  accuracies?: { white: number; black: number }
  white: ChessComGamePlayer
  black: ChessComGamePlayer
}

interface ArchiveList {
  archives: string[]
}

interface MonthlyArchive {
  games: ChessComGame[]
}

export type ScoutErrorKind = 'user-not-found' | 'rate-limited' | 'network'

export interface ScoutError {
  kind: ScoutErrorKind
  message: string
}

/** Errors are returned, never thrown, so callers must handle every case. */
export type ApiResult<T> = { ok: true; value: T } | { ok: false; error: ScoutError }

export interface CollectProgress {
  archivesFetched: number
  totalArchives: number
  gamesCollected: number
  target: number
}

const getJson = async <T>(url: string): Promise<ApiResult<T>> => {
  let response: Response
  try {
    response = await fetch(url)
  } catch {
    return {
      ok: false,
      error: { kind: 'network', message: 'Could not reach chess.com. Check your connection.' },
    }
  }

  if (response.status === 404) {
    return { ok: false, error: { kind: 'user-not-found', message: 'Not found on chess.com.' } }
  }
  if (response.status === 429) {
    return {
      ok: false,
      error: { kind: 'rate-limited', message: 'chess.com is rate-limiting us. Try again in a moment.' },
    }
  }
  if (!response.ok) {
    return {
      ok: false,
      error: { kind: 'network', message: `chess.com responded with status ${response.status}.` },
    }
  }

  try {
    return { ok: true, value: (await response.json()) as T }
  } catch {
    return { ok: false, error: { kind: 'network', message: 'chess.com returned an unreadable response.' } }
  }
}

export const fetchProfile = (username: string): Promise<ApiResult<ChessComProfile>> =>
  getJson<ChessComProfile>(`${API_BASE}/player/${encodeURIComponent(username)}`)

/** Time controls the player never touched are simply absent from the response. */
export const fetchStats = (username: string): Promise<ApiResult<ChessComStats>> =>
  getJson<ChessComStats>(`${API_BASE}/player/${encodeURIComponent(username)}/stats`)

/**
 * Collects the player's most recent standard-rules games, newest first.
 * Monthly archives are fetched strictly one at a time (chess.com asks for
 * serial access), newest month first, stopping as soon as `limit` games are
 * gathered. Any failure mid-collection is returned as an error — never a
 * silently truncated success.
 */
export const collectRecentGames = async (
  username: string,
  limit = 100,
  onProgress?: (progress: CollectProgress) => void,
): Promise<ApiResult<ChessComGame[]>> => {
  const archiveList = await getJson<ArchiveList>(
    `${API_BASE}/player/${encodeURIComponent(username)}/games/archives`,
  )
  if (!archiveList.ok) return archiveList

  const urls = [...(archiveList.value.archives ?? [])].reverse()
  const games: ChessComGame[] = []

  for (let i = 0; i < urls.length && games.length < limit; i++) {
    const month = await getJson<MonthlyArchive>(urls[i])
    if (!month.ok) return month

    // Within a month games are ordered oldest → newest, so walk backwards.
    const monthGames = month.value.games ?? []
    for (let j = monthGames.length - 1; j >= 0 && games.length < limit; j--) {
      if (monthGames[j].rules === 'chess') games.push(monthGames[j])
    }

    onProgress?.({
      archivesFetched: i + 1,
      totalArchives: urls.length,
      gamesCollected: games.length,
      target: limit,
    })
  }

  return { ok: true, value: games }
}
