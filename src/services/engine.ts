import type { Square } from 'chess.js'
import type { Difficulty, PromotionPiece } from '@/types/chess.types'

/**
 * Thin promise-based UCI wrapper around the Stockfish worker vendored in
 * `public/engine/` (stockfish 18, lite single-threaded build — no
 * SharedArrayBuffer, so no COOP/COEP headers needed). The worker resolves its
 * .wasm sibling relative to its own URL, which is why the assets are served
 * verbatim instead of going through Vite's bundling.
 */
const ENGINE_URL = `${import.meta.env.BASE_URL}engine/stockfish-18-lite-single.js`

const HANDSHAKE_TIMEOUT_MS = 15_000
/** Grace on top of a preset's movetime before a search is declared dead. */
const SEARCH_TIMEOUT_GRACE_MS = 10_000

export interface EnginePreset {
  /** Stockfish `Skill Level` option (0–20). */
  skillLevel: number
  /** Search depth cap — the real softener at low levels. */
  depth: number
  /** Think-time cap in milliseconds. */
  moveTimeMs: number
}

export const ENGINE_PRESETS: Record<Difficulty, EnginePreset> = {
  easy: { skillLevel: 2, depth: 4, moveTimeMs: 300 },
  medium: { skillLevel: 8, depth: 8, moveTimeMs: 600 },
  hard: { skillLevel: 18, depth: 14, moveTimeMs: 1200 },
}

export interface EngineMove {
  from: Square
  to: Square
  promotion?: PromotionPiece
}

export type EngineErrorKind = 'load' | 'search' | 'stale'

export interface EngineError {
  kind: EngineErrorKind
  message: string
}

/** Errors are returned, never thrown, so callers must handle every case. */
export type EngineResult<T> = { ok: true; value: T } | { ok: false; error: EngineError }

export interface EngineHandle {
  /** Resets the engine for a fresh game; in-flight searches become stale. */
  newGame: (preset: EnginePreset) => void
  /** Resolves with the best move for `fen`, or an error (kind 'stale' if superseded). */
  bestMove: (fen: string, preset: EnginePreset) => Promise<EngineResult<EngineMove>>
  /** Terminates the worker. The handle is unusable afterwards. */
  dispose: () => void
}

const BESTMOVE_RE = /^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/

const parseBestMove = (line: string): EngineMove | null => {
  const match = BESTMOVE_RE.exec(line)
  if (!match) return null
  return {
    from: match[1] as Square,
    to: match[2] as Square,
    promotion: (match[3] as PromotionPiece | undefined) ?? undefined,
  }
}

/**
 * Spawns the engine worker and performs the `uci` → `uciok` handshake.
 * Resolves with a load error (never rejects) if the worker or its WASM fails
 * to come up within the timeout.
 */
export const createEngine = async (): Promise<EngineResult<EngineHandle>> => {
  let worker: Worker
  try {
    worker = new Worker(ENGINE_URL)
  } catch {
    return {
      ok: false,
      error: { kind: 'load', message: 'Could not start the chess engine worker.' },
    }
  }

  const handshake = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => finish(false), HANDSHAKE_TIMEOUT_MS)
    const onMessage = (event: MessageEvent) => {
      if (String(event.data).startsWith('uciok')) finish(true)
    }
    const onError = () => finish(false)
    const finish = (ok: boolean) => {
      clearTimeout(timer)
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      resolve(ok)
    }
    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    worker.postMessage('uci')
  })

  if (!handshake) {
    worker.terminate()
    return {
      ok: false,
      error: { kind: 'load', message: 'The chess engine failed to load. Try reloading the page.' },
    }
  }

  // Bumped by newGame/dispose; searches started under an older generation
  // resolve as 'stale' and their bestmove lines are ignored.
  let generation = 0

  const newGame = (preset: EnginePreset) => {
    generation++
    worker.postMessage('stop')
    worker.postMessage('ucinewgame')
    worker.postMessage(`setoption name Skill Level value ${preset.skillLevel}`)
  }

  const bestMove = (fen: string, preset: EnginePreset): Promise<EngineResult<EngineMove>> => {
    const searchGeneration = generation
    return new Promise((resolve) => {
      const timer = setTimeout(
        () =>
          finish({
            ok: false,
            error: { kind: 'search', message: 'The chess engine stopped responding.' },
          }),
        preset.moveTimeMs + SEARCH_TIMEOUT_GRACE_MS,
      )
      const onMessage = (event: MessageEvent) => {
        const move = parseBestMove(String(event.data))
        if (!move) return
        if (searchGeneration !== generation) {
          finish({ ok: false, error: { kind: 'stale', message: 'Search superseded by a new game.' } })
          return
        }
        finish({ ok: true, value: move })
      }
      const onError = () =>
        finish({
          ok: false,
          error: { kind: 'search', message: 'The chess engine crashed while thinking.' },
        })
      const finish = (result: EngineResult<EngineMove>) => {
        clearTimeout(timer)
        worker.removeEventListener('message', onMessage)
        worker.removeEventListener('error', onError)
        resolve(result)
      }
      worker.addEventListener('message', onMessage)
      worker.addEventListener('error', onError)
      worker.postMessage(`position fen ${fen}`)
      worker.postMessage(`go depth ${preset.depth} movetime ${preset.moveTimeMs}`)
    })
  }

  const dispose = () => {
    generation++
    worker.terminate()
  }

  return { ok: true, value: { newGame, bestMove, dispose } }
}
