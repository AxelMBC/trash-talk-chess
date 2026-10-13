import personaRaw from '@/data/persona.md?raw'
import { pickLine } from '@/data/trashTalk'
import type { PickedLine, TrashTalkMoment } from '@/types/trashTalk.types'

/**
 * The trash-talk swap seam. A line source turns a moment into a line,
 * asynchronously; everything upstream (event detection, moment building, the
 * bubble) is source-agnostic. The next step plugs an LLM source in here —
 * `PERSONA` is its system prompt, the moment is its user prompt — and
 * `resolveLine`'s fallback keeps the static bank as the safety net.
 */
export type LineSource = (moment: TrashTalkMoment) => Promise<PickedLine | null>

/** The voice contract from `persona.md` — the future LLM system prompt. */
export const PERSONA: string = personaRaw

/** A generated line may take this long before the static bank takes over. */
const SOURCE_TIMEOUT_MS = 2_500

export const staticLineSource: LineSource = (moment) => Promise.resolve(pickLine(moment))

/** Swap point: replace with an LLM-backed source to change how lines are made. */
export const activeLineSource: LineSource = staticLineSource

const timeout = (ms: number): Promise<null> =>
  new Promise((resolve) => setTimeout(() => resolve(null), ms))

/**
 * Resolves a line through `source` with a timeout, falling back to the
 * static bank on failure or silence. Never rejects — a null just means
 * nothing gets said this trigger.
 */
export const resolveLine = async (
  source: LineSource,
  moment: TrashTalkMoment,
): Promise<PickedLine | null> => {
  try {
    const result = await Promise.race([source(moment), timeout(SOURCE_TIMEOUT_MS)])
    if (result) return result
  } catch {
    // Fall through to the static bank.
  }
  if (source === staticLineSource) return null
  try {
    return await staticLineSource(moment)
  } catch {
    return null
  }
}
