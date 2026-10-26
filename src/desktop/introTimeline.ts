import type { DialogueMessage } from './dialogues'

export const INTRO_MAX_MS = 25_000
export const INTRO_FADE_MS = 300
export const INTRO_FLASH_IN_MS = 120
export const INTRO_FLASH_OUT_MS = 300

const FRAME_IDS = [
  ['sb_01'],
  ['sb_02', 'sb_03', 'sb_04', 'sb_05', 'sb_06', 'sb_07'],
  ['sb_08', 'sb_09'],
  ['sb_10'],
]

export interface IntroStep {
  atMs: number
  frame: number
  messages: readonly DialogueMessage[]
  fadingOut: boolean
}

/** 按码点计字，避免把 emoji 等字符算成两字。 */
export const holdMs = (text: string): number => 700 + 80 * [...text].length

/** 用文案契约的 id 分帧；聊天帧和独白帧都保留已出现的条目。 */
export function buildIntroTimeline(storyboard: readonly DialogueMessage[]): IntroStep[] {
  const steps: IntroStep[] = []
  let atMs = 0
  FRAME_IDS.forEach((ids, frame) => {
    const messages = storyboard.filter((m) => ids.includes(m.id)).sort((a, b) => a.orderInGroup - b.orderInGroup)
    messages.forEach((message, index) => {
      steps.push({ atMs, frame, messages: messages.slice(0, index + 1), fadingOut: false })
      if (frame < 3) atMs += holdMs(message.text)
    })
    if (frame < 3) {
      steps.push({ atMs, frame, messages, fadingOut: true })
      atMs += INTRO_FADE_MS
    }
  })
  return steps
}
