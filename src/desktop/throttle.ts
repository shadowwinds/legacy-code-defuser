import { MAX_TOASTS_PER_GAME, THROTTLE_WINDOW_MS } from './tiers'
import type { InterruptTier } from './tiers'

export interface ThrottleState {
  /** 本局已弹出的 toast 数 */
  toastCount: number
  /** 上一条 toast 弹出时刻（epoch ms）；本局未弹过为 null */
  lastToastAt: number | null
}

/**
 * 节流判档：基础档位 → 实际档位（pacing §3）。
 * 每局 ≤6 条、任意 15s 窗口内 ≤1 条，超出的降成 C 档红点（防 40–50s 扎堆）。
 */
export function decideTier(base: InterruptTier, nowMs: number, s: ThrottleState): InterruptTier {
  if (base === 'C') return 'C'
  if (s.toastCount >= MAX_TOASTS_PER_GAME) return 'C'
  if (s.lastToastAt !== null && nowMs - s.lastToastAt < THROTTLE_WINDOW_MS) return 'C'
  return base
}
