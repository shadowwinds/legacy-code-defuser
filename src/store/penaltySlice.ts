import type { StateCreator } from 'zustand'
import type { RootState } from './index'

/** 行锁定表：键 = 行号（1–5），值 = 解锁时间戳（epoch ms） */
export type RowLocks = Record<number, number>

export interface ApplyPenaltyOptions {
  /** 目标行（1–5）；与 all 同时给时优先 all */
  row?: number
  /** 全场未拆模块扣时 */
  all?: boolean
  /** 扣除秒数 */
  sec: number
  /** 附加行锁定时长（秒）；仅 row 模式生效，锁定期间该行 UI 灰化 */
  lockSec?: number
  /** 惩罚来源标识（预留：日志/音效挂钩，本票不消费） */
  source?: string
}

export interface PenaltyState {
  /** 行锁定表（锁定期间网格该行加 .locked 灰化样式） */
  locks: RowLocks
  /** Row4 是否失衡（Edge A 源头状态，GDD 02 §2.5；#7 票实装真实翻转） */
  row4Imbalanced: boolean
  /** 失衡起始时间戳（epoch ms）；未失衡为 null */
  imbalanceSince: number | null
  /**
   * 错误操作惩罚统一入口：内部委托 engine 的 penalizeRow/penalizeAll，
   * 供各模块票/耦合边调用（engine 原生 actions 保留，模块票可直接用）。
   */
  applyPenalty: (opts: ApplyPenaltyOptions) => void
  /** 该行是否处于锁定状态 */
  isRowLocked: (row: number) => boolean
  /** 翻转 Row4 失衡状态（记录/清除失衡起始时间戳） */
  setImbalance: (v: boolean) => void
  /** 清理已到期的锁定（引擎 tick 每 100ms 调用一次） */
  pruneLocks: () => void
}

export const createPenaltySlice: StateCreator<RootState, [], [], PenaltyState> = (set, get) => ({
  locks: {},
  row4Imbalanced: false,
  imbalanceSince: null,

  applyPenalty: (opts) => {
    const s = get()
    if (s.status !== 'playing') return
    const { row, all, sec, lockSec } = opts
    if (all) {
      s.penalizeAll(sec)
      return
    }
    if (row === undefined) return
    s.penalizeRow(row, sec)
    if (lockSec && lockSec > 0) {
      set({ locks: { ...s.locks, [row]: Date.now() + lockSec * 1000 } })
    }
  },

  isRowLocked: (row) => (get().locks[row] ?? 0) > Date.now(),

  setImbalance: (v) =>
    set(v ? { row4Imbalanced: true, imbalanceSince: Date.now() } : { row4Imbalanced: false, imbalanceSince: null }),

  pruneLocks: () => {
    const s = get()
    const now = Date.now()
    const entries = Object.entries(s.locks)
    if (!entries.some(([, until]) => until <= now)) return
    const locks: RowLocks = {}
    for (const [row, until] of entries) {
      if (until > now) locks[Number(row)] = until
    }
    set({ locks })
  },
})
