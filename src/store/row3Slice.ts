import type { StateCreator } from 'zustand'
import type { RootState } from './index'
import { PASSCODES } from '../data/passcodes'

/** Row3 乱码考古三阶段状态机（GDD 02 §2.3）：拉列宽 → 切格式 → 填口令 */
export type Row3Stage = 'narrow' | 'revealed' | 'formatted' | 'solved'

/** D 列数字格式 */
export type Row3FormatMode = 'general' | 'shortDate'

/** D 列宽拉过该阈值（px）→ #### 显形为序列值（阶段①达成） */
export const D_COL_REVEAL_THRESHOLD = 100

/** Row3 行号（模块下标 2） */
export const ROW3 = 3

/** 口令宽容匹配：trim + 全角转半角 + 压缩连续空白 + 忽略大小写 */
function normalize(text: string): string {
  return text
    .trim()
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export interface Row3State {
  /** 三阶段状态机；初始 ####（列宽不足） */
  stage: Row3Stage
  /** D 列宽（px），拖 D/E 分界线改变；初始窄值 → D3 显示 #### */
  dColWidth: number
  /** 顶部格式下拉当前值；revealed 态切 shortDate → 进入 formatted */
  formatMode: Row3FormatMode
  /** 填错锁：true = 口令填错过，倒计时已锁在 5s，须填对解锁 */
  wrongLock: boolean
  /** 拖拽设置 D 列宽；narrow 态拉过阈值 → revealed */
  setDColWidth: (w: number) => void
  /** 切换数字格式；revealed 态切 shortDate → formatted */
  setFormatMode: (m: Row3FormatMode) => void
  /**
   * 提交口令（读本局 passcodes[passcodeIndex] 宽容比对）。
   * 对 → defuseModule(3) + stage solved + 清填错锁；
   * 错 → Row3 扣到剩 5s + freezeRow 锁倒计时 + wrongLock=true。
   */
  submitPasscode: (text: string) => 'correct' | 'wrong'
}

export const createRow3Slice: StateCreator<RootState, [], [], Row3State> = (set, get) => ({
  stage: 'narrow',
  dColWidth: 72,
  formatMode: 'general',
  wrongLock: false,

  setDColWidth: (w) => {
    const s = get()
    const stage = s.stage === 'narrow' && w >= D_COL_REVEAL_THRESHOLD ? 'revealed' : s.stage
    set({ dColWidth: w, stage })
  },

  setFormatMode: (m) => {
    const s = get()
    const stage = s.stage === 'revealed' && m === 'shortDate' ? 'formatted' : s.stage
    set({ formatMode: m, stage })
  },

  submitPasscode: (text) => {
    const s = get()
    if (s.status !== 'playing') return 'wrong'
    const entry = PASSCODES[s.passcodeIndex]
    if (normalize(text) !== normalize(entry.passcode)) {
      // 填错：Row3 扣到剩 5s（clamp ≥ 0，不会触爆）+ 冻结倒计时 + 填错锁
      window.dispatchEvent(new CustomEvent('lcd:penalty', { detail: { row: ROW3, sec: 5, source: 'row3:wrong' } }))
      const sec = Math.max(0, s.modules[ROW3 - 1].remaining - 5)
      s.penalizeRow(ROW3, sec)
      s.freezeRow(ROW3, 9999999)
      set({ wrongLock: true })
      return 'wrong'
    }
    // 填对（含填错后改对）：拆除后 tick 跳过该行，冻结自然失效
    s.defuseModule(ROW3)
    set({ stage: 'solved', wrongLock: false })
    return 'correct'
  },
})
