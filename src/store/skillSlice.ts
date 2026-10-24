import type { StateCreator } from 'zustand'
import type { RootState } from './index'

/** 格式刷 CD（ms） */
export const FORMAT_BRUSH_CD_MS = 30_000
/** 格式刷假绿持续（ms） */
export const FORMAT_BRUSH_ACTIVE_MS = 10_000
/** 冻结窗格 CD（ms） */
export const FREEZE_PANE_CD_MS = 45_000
/** 冻结窗格单行冻结时长（ms） */
export const FREEZE_PANE_ROW_MS = 8_000
/** 冻结窗格作用行（前 4 行） */
export const FREEZE_PANE_ROWS: readonly number[] = [1, 2, 3, 4]

export type SkillName = 'formatBrush' | 'freezePane'

export interface SkillState {
  /** 格式刷：CD 截止 / 假绿效果截止（epoch ms，0 = 未使用） */
  formatBrush: { cdUntil: number; activeUntil: number }
  /** 冻结窗格：CD 截止（epoch ms，0 = 未使用） */
  freezePane: { cdUntil: number }
  /** 格式刷假绿目标行（当前选中行；选装饰行 = 白白浪费，不拦截） */
  greenWashRow: number | null
  /**
   * 施放技能：status 非 playing 或 CD 中 → false。
   * 格式刷是掩耳盗铃：数据条假绿只骗视觉，引擎倒计时照跑（不动引擎状态）；
   * 冻结窗格委托引擎 freezeRow（tick 跳过，真冻结）。
   */
  useSkill: (name: SkillName) => boolean
  /** 格式刷是否 CD 中 */
  isFormatBrushCd: () => boolean
  /** 冻结窗格是否 CD 中 */
  isFreezePaneCd: () => boolean
  /** 该行是否处于假绿效果期（activeUntil > now && row === greenWashRow） */
  isGreenWashed: (row: number) => boolean
}

export const createSkillSlice: StateCreator<RootState, [], [], SkillState> = (set, get) => ({
  formatBrush: { cdUntil: 0, activeUntil: 0 },
  freezePane: { cdUntil: 0 },
  greenWashRow: null,

  useSkill: (name) => {
    const s = get()
    if (s.status !== 'playing') return false
    const now = Date.now()

    if (name === 'formatBrush') {
      if (s.formatBrush.cdUntil > now) return false
      // 目标 = 当前选中行：仅视觉假绿（greenWashRow + activeUntil），倒计时照跑
      set({
        formatBrush: {
          cdUntil: now + FORMAT_BRUSH_CD_MS,
          activeUntil: now + FORMAT_BRUSH_ACTIVE_MS,
        },
        greenWashRow: s.selectedRow,
      })
      return true
    }

    if (s.freezePane.cdUntil > now) return false
    // 前 4 行各冻结 8s（引擎级真冻结：tick 跳过这些行）
    for (const row of FREEZE_PANE_ROWS) s.freezeRow(row, FREEZE_PANE_ROW_MS)
    set({ freezePane: { cdUntil: now + FREEZE_PANE_CD_MS } })
    return true
  },

  isFormatBrushCd: () => get().formatBrush.cdUntil > Date.now(),
  isFreezePaneCd: () => get().freezePane.cdUntil > Date.now(),
  isGreenWashed: (row) => {
    const s = get()
    return s.formatBrush.activeUntil > Date.now() && s.greenWashRow === row
  },
})
