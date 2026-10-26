import { useDesktopStore } from './desktopStore'
import { endingOf, getEndingGroup } from './dialogues'
import { ENDING_BUBBLE_INTERVAL_MS } from './tiers'
import { useGameStore } from '../store'

let started = false

/**
 * 终局结局对话编排（T6）：status 离开 playing → 结局组气泡按 400ms 吐入只读结局视图。
 * 气泡不走 deliver（终局已有爆炸蜂鸣 / 通关和弦，叠加提示音会撞音，#29 偏离 8）。
 */
export function initEndingSequence(): void {
  if (started) return
  started = true
  useGameStore.subscribe((state, prev) => {
    if (prev.status !== 'playing' || state.status === 'playing') return
    const ending = endingOf(state)
    if (!ending) return
    // startEndingView 会清空 toast；ChatOverlay 看到 endingView 非空自行让位
    useDesktopStore.getState().startEndingView(ending)
    getEndingGroup(ending).forEach((m, i) => {
      window.setTimeout(() => useDesktopStore.getState().appendEndingBubble(m.id), i * ENDING_BUBBLE_INTERVAL_MS)
    })
  })
}
