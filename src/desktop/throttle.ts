import type { InterruptTier } from './tiers'

export interface ThrottleState {
  /** 本局已弹出的 toast 数 */
  toastCount: number
  /** 上一条 toast 弹出时刻（epoch ms）；本局未弹过为 null */
  lastToastAt: number | null
}

/**
 * 节流判档：基础档位 → 实际档位（pacing §3）。
 * T0 桩：原样返回基础档位；T4 实装「每局 ≤6 条 + 15s 窗口 1 条，超出降 C」。
 */
export function decideTier(base: InterruptTier, _nowMs: number, _s: ThrottleState): InterruptTier {
  return base
}
