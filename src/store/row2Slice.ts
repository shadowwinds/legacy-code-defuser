import type { StateCreator } from 'zustand'
import type { RootState } from './index'
import { getRunConfig } from '../lib/seed'
import { judgeRow2, row2Appearance, type Row2Guard } from '../rules/modules/row2'

/** Row2 错误编辑惩罚秒数（数值写死待 playtest，GDD 02 §2.3 Row2） */
export const ROW2_FAIL_PENALTY_SEC = 10

export type EditFxResult = 'ok' | 'iferror' | 'fail'

export interface Row2State {
  /** Row2 #DEADLOCK! 死锁中（初始 true；editFx 判定通过后解除） */
  deadlocked: boolean
  /** v2：本局守卫变量（GDD 07 §7.3 Row2）；v1 固定 ENV */
  row2Guard: Row2Guard
  /** IFERROR 彩蛋标记（套 =IFERROR 解锁时置 true，供「糊弄学大师。」批注消费） */
  iferrorEgg: boolean
  /**
   * fx 栏提交判定（Row2 死锁中）：
   * - 把 "PRODUCTION" 改成 "LOCALHOST" → 'ok'：解除死锁 + 拆除 Row2
   * - 最外层套 =IFERROR(原公式, "200 OK") → 'iferror'：同上 + iferrorEgg
   * - 其他改动 → 'fail'：Row2 -10s
   * 宽容匹配：引号单双、大小写不敏感；容忍空白差异与行尾 // 注释。
   * v2：按 rules/modules/row2.ts 判定（守卫 × 平日/周末；IFERROR 需宏警告条 + 外包-张三）。
   */
  editFx: (text: string) => EditFxResult
}

/** 提交文本归一化：去 // 注释、转大写、去全部空白 */
const squash = (text: string) =>
  text
    .replace(/\/\/.*$/gm, '')
    .toUpperCase()
    .replace(/\s+/g, '')

/** =IF(ENV="LOCALHOST", CRASH_NOW(), "SAFE")（引号单双/大小写宽容） */
const RE_LOCALHOST = /^=IF\(ENV=(["'])LOCALHOST\1,CRASH_NOW\(\),(["'])SAFE\2\)$/

/** =IFERROR(IF(ENV="PRODUCTION"|"LOCALHOST", CRASH_NOW(), "SAFE"), "200 OK")，允许内层保留等号 */
const RE_IFERROR =
  /^=IFERROR\(=?IF\(ENV=(["'])(?:PRODUCTION|LOCALHOST)\1,CRASH_NOW\(\),(["'])SAFE\2\),(["'])200OK\3\)$/

export const createRow2Slice: StateCreator<RootState, [], [], Row2State> = (set, get) => ({
  deadlocked: true,
  row2Guard: row2Appearance(getRunConfig().seed).guard,
  iferrorEgg: false,

  editFx: (text) => {
    const s = get()
    if (s.status !== 'playing' || !s.deadlocked) return 'fail'

    const t = squash(text)
    const v2 = getRunConfig().v2 ? judgeRow2(text, s.situation, { guard: s.row2Guard }) : null
    if (v2 ? v2 === 'iferror' : RE_IFERROR.test(t)) {
      set({ deadlocked: false, iferrorEgg: true })
      s.defuseModule(2)
      return 'iferror'
    }
    if (v2 ? v2 === 'ok' : RE_LOCALHOST.test(t)) {
      set({ deadlocked: false })
      s.defuseModule(2)
      return 'ok'
    }
    s.applyPenalty({ row: 2, sec: ROW2_FAIL_PENALTY_SEC, source: 'row2:editFx' })
    return 'fail'
  },
})
