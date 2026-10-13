import type { PickedLine, TrashTalkCategory, TrashTalkMoment } from '@/types/trashTalk.types'

/**
 * The engine's mouth: categorized one-liners fired by in-game events, in the
 * voice defined by `persona.md`. Static and threshold-free by design — this
 * bank is the fallback and few-shot source once an LLM line source takes
 * over via `services/lineSource.ts`. Every entry receives the full
 * `TrashTalkMoment`, and `applies` predicates gate lines to moments where
 * they are actually true (difficulty, profile facts, session stats).
 */
interface TrashTalkEntry {
  id: string
  /** When present, the line is only eligible for moments where this holds. */
  applies?: (moment: TrashTalkMoment) => boolean
  line: (moment: TrashTalkMoment) => string
}

const hasProfile = (m: TrashTalkMoment) => m.profile !== null

const BANK: Record<TrashTalkCategory, TrashTalkEntry[]> = {
  playerBad: [
    { id: 'bad-my-god', line: () => 'My god you are bad at chess.' },
    { id: 'bad-eyes', line: () => 'My fucking eyes!' },
    {
      id: 'bad-difficulty',
      applies: (m) => m.difficulty !== 'easy',
      line: (m) =>
        `I do not know why you chose ${m.difficulty} difficulty when you make moves like that.`,
    },
    { id: 'bad-pigeon', line: () => 'I have seen pigeons knock over pieces with more of a plan.' },
    { id: 'bad-blink', line: () => 'Blink twice if someone is forcing you to play like this.' },
    { id: 'bad-404', line: () => '404: strategy not found.' },
    { id: 'bad-pawn-shame', line: () => 'Even the pawn you just doomed is embarrassed for you.' },
    {
      id: 'bad-escalation',
      applies: (m) => m.session.playerBlunders >= 3,
      line: (m) =>
        `Blunder number ${m.session.playerBlunders}. I am not mad, I am just laughing.`,
    },
    {
      id: 'bad-scout-lied',
      applies: (m) => hasProfile(m) && m.profile!.facts.rating !== null,
      line: (m) => `Your file says ${m.profile!.facts.rating}. Your file is a liar.`,
    },
  ],
  playerNeutral: [
    { id: 'neutral-boring', line: () => 'You are one hell of a boring player.' },
    { id: 'neutral-riveting', line: () => 'Riveting stuff. Wake me up when something happens.' },
    { id: 'neutral-nothing', line: () => 'That move did nothing. Like, aggressively nothing.' },
    {
      id: 'neutral-file-weird',
      applies: hasProfile,
      line: (m) => `I read your file, ${m.profile!.facts.username}. It did not prepare me for moves this mid.`,
    },
  ],
  playerGood: [
    { id: 'good-disgusting', line: () => 'That was a good move. Disgusting, but good.' },
    { id: 'good-imposter', line: () => 'A correct move?? Who are you and what have you done with the guy from three turns ago?' },
    { id: 'good-still-doomed', line: () => 'Okay, that was decent. I am still going to end you, but decent.' },
  ],
  fork: [
    { id: 'fork-800', line: () => 'That was a good move, I did not know an 800 knew how to fork.' },
    { id: 'fork-cutlery', line: () => 'A fork? Look at you, discovering cutlery.' },
  ],
  capture: [
    { id: 'capture-thief', line: () => 'Thief. THIEF!' },
    { id: 'capture-last-happy', line: () => 'Enjoy that piece. It is the last happy thing that happens to you.' },
  ],
  check: [
    { id: 'check-adorable', line: () => 'A check? Adorable. Do it again, see what happens.' },
    { id: 'check-tickles', line: () => 'Was that supposed to scare me? It tickled.' },
  ],
  promotion: [
    { id: 'promo-take-too', line: () => 'A new queen? Congrats, I will take that one too.' },
  ],
  engineMove: [
    { id: 'engine-easy-boy', line: () => "This Shit's EASY BOY." },
    { id: 'engine-not-that-it-matters', line: () => 'Your move, buddy. Not that it matters.' },
    {
      id: 'engine-streak',
      applies: (m) => hasProfile(m) && m.profile!.facts.recentRecord.length > 0,
      line: (m) => `Your last stretch went ${m.profile!.facts.recentRecord}. This game is going in the L column.`,
    },
  ],
  engineMateSoon: [
    {
      id: 'mate-wasting-time',
      line: (m) => `${m.mateIn ?? 'A few'} moves away and you will finally stop wasting my time.`,
    },
    {
      id: 'mate-surprised-face',
      line: (m) => `Mate in ${m.mateIn ?? 'a few'}. Start practicing your surprised face.`,
    },
  ],
  engineCrushing: [
    { id: 'crush-fucked', line: () => 'You are fucked.' },
    { id: 'crush-commentators', line: () => 'This position is so lost even the commentators went home.' },
  ],
  slowPlay: [
    { id: 'slow-faster', line: () => 'Hey buddy, can you make your moves faster?' },
    { id: 'slow-tournaments', line: () => 'I have played entire tournaments in the time you have been staring.' },
    {
      id: 'slow-timeout-artist',
      applies: (m) => hasProfile(m) && m.profile!.facts.timeoutLosses >= 3,
      line: () => 'Careful with the staring. Your file says timeouts are kind of your thing.',
    },
  ],
}

/** Last line served per category — the floor when a whole pool is exhausted. */
const lastPicked = new Map<TrashTalkCategory, string>()

/**
 * Returns a line for the moment's category: `applies` predicates first, then
 * lines not yet said this game, then (when everything has been said) anything
 * but the immediately previous pick. Null only when nothing is eligible.
 */
export const pickLine = (moment: TrashTalkMoment): PickedLine | null => {
  const eligible = BANK[moment.category].filter((entry) => entry.applies?.(moment) ?? true)
  if (eligible.length === 0) return null
  const unsaid = eligible.filter((entry) => !moment.session.saidLineIds.includes(entry.id))
  const base = unsaid.length > 0 ? unsaid : eligible
  const fresh = base.filter((entry) => entry.id !== lastPicked.get(moment.category))
  const pool = fresh.length > 0 ? fresh : base
  const entry = pool[Math.floor(Math.random() * pool.length)]
  lastPicked.set(moment.category, entry.id)
  return { id: entry.id, text: entry.line(moment) }
}
