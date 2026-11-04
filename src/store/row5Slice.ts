import type { StateCreator } from 'zustand'
import type { RootState } from './index'
import { EDGE_B } from '../lib/dependencyGraph'
import { getRunConfig } from '../lib/seed'
import { row5Answer, row5Appearance, type Row5Code, type Row5Ritual } from '../rules/modules/row5'

/** v2：选错仪式本行扣秒（仍在窗口内可重试，GDD 07 §7.3 Row5，待 playtest） */
export const ROW5_WRONG_PENALTY_SEC = 10

/** Row5 假死周期（毫秒）：开局 45s 后首次假死，此后每 45s 一次（固定周期，无随机轴） */
export const ROW5_STUCK_PERIOD_MS = 45_000
/** 假死后重启仪式窗口（毫秒）：窗口内重启成功，窗口过 Row5 直接爆炸 */
export const ROW5_RITUAL_WINDOW_MS = 15_000
/** 周期机轮询间隔（毫秒）：轻量 500ms 检查 */
const POLL_MS = 500
/** Edge B 反噬闪烁持续时间（毫秒）：闪两下后清除 edgeBHitRow */
const EDGE_B_FLASH_MS = 1_200

export type Row5Phase = 'normal' | 'stuck'

export interface Row5State {
  /** Row5 当前阶段：normal 运行中 / stuck 假死（15s 重启窗口进行中） */
  row5Phase: Row5Phase
  /** 本次假死开始的 epoch ms；normal 时为 null */
  row5StuckAt: number | null
  /** Edge B 反噬命中的行号（该行单元格闪两下）；1.2s 后自动清 null */
  edgeBHitRow: number | null
  /** v2：假死时 F5 报错码（本局外观）；v1 固定 #STUCK! */
  row5Code: Row5Code
  /**
   * 重启仪式：仅 stuck 且 playing 时有效；成功 = Row5 拆除 + Edge B 反噬随机未拆模块。
   * v1 只有 [重启服务] 一个选项，调用即成功；v2 按规则表（报错码 × 外壳开关）判定，选错本行 -10s 可重试。
   */
  performRitual: (ritual?: Row5Ritual) => 'correct' | 'wrong' | 'ignored'
}

/**
 * Row5 拜机房神兽切片（issue #10，GDD 02 §2.3 / §2.5 Edge B）。
 * 周期机用模块内 500ms 轻量 interval 驱动（本切片独占，引擎 100ms tick 不掺和）；
 * status !== 'playing' 时轮询直接返回（周期机停）。
 */
export const createRow5Slice: StateCreator<RootState, [], [], Row5State> = (set, get) => {
  const v2 = getRunConfig().v2
  const appearance = row5Appearance(getRunConfig().seed)
  /** 首次假死距开局：v1 固定 45s，v2 每局 35–55s */
  const firstStuckMs = v2 ? appearance.firstStuckMs : ROW5_STUCK_PERIOD_MS
  /** 下次假死时刻：开局（startGame）firstStuckMs 后；开局前为 null */
  let nextStuckAt: number | null = null
  /** 首次仪式成功 = Row5 拆除，之后不再假死（周期机停止推进） */
  let ritualSucceeded = false

  const poll = () => {
    const s = get()
    if (s.status !== 'playing' || s.gameStartedAt === null) return
    nextStuckAt ??= s.gameStartedAt + firstStuckMs
    const now = Date.now()

    if (s.row5Phase === 'normal') {
      if (ritualSucceeded) return
      if (now >= nextStuckAt) {
        set({ row5Phase: 'stuck', row5StuckAt: now })
      }
      return
    }

    // stuck：窗口过 → Row5 直接爆炸（penalizeRow 扣 999s 归零，复用引擎爆炸文案）
    if (s.row5StuckAt !== null && now - s.row5StuckAt >= ROW5_RITUAL_WINDOW_MS) {
      s.penalizeRow(5, 999)
    }
  }

  window.setInterval(poll, POLL_MS)

  return {
    row5Phase: 'normal',
    row5StuckAt: null,
    edgeBHitRow: null,
    row5Code: v2 ? appearance.code : '#STUCK!',

    performRitual: (ritual = 'restart') => {
      const s = get()
      if (s.status !== 'playing' || s.row5Phase !== 'stuck') return 'ignored'

      if (v2 && ritual !== row5Answer(s.situation, { code: s.row5Code })) {
        s.applyPenalty({ row: 5, sec: ROW5_WRONG_PENALTY_SEC, source: 'row5:wrong' })
        return 'wrong'
      }

      // 阶段推进重置：成功后周期机停止，Row5 不再假死
      ritualSucceeded = true
      set({ row5Phase: 'normal', row5StuckAt: null })

      // 首次仪式成功 = Row5 拆除（回满 + 已拆；第 5 个拆完会直接 won）
      s.defuseModule(5)

      const after = get()
      if (after.status !== 'playing') return 'correct'

      // Edge B · 重启是赌博：随机 1 个未拆模块 -5s（Row5 已拆自然排除）
      const aliveRows = after.modules.filter((m) => !m.defused).map((m) => m.row)
      const target = EDGE_B.pickTarget?.(aliveRows) ?? null
      if (target === null) return 'correct'

      after.applyPenalty({ row: target, sec: EDGE_B.penaltySec, source: 'edge-b' })
      set({ edgeBHitRow: target })
      window.setTimeout(() => {
        if (get().edgeBHitRow === target) set({ edgeBHitRow: null })
      }, EDGE_B_FLASH_MS)
      return 'correct'
    },
  }
}
