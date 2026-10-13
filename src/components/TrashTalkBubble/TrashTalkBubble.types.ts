import type { TrashTalkLine } from '@/hooks/useTrashTalk'

export interface TrashTalkBubbleProps {
  /** Current line, or null to show nothing. Keyed by `line.id` for transitions. */
  line: TrashTalkLine | null
}
