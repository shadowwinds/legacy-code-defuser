import type { StateCreator } from 'zustand'
import type { RootState } from './index'

/** Row1 选错惩罚秒数（数值写死待 playtest，GDD 02 §2.3 Row1） */
export const ROW1_WRONG_PENALTY_SEC = 20
/** Row1 陷阱选项（合并后居中）全场惩罚秒数 */
export const ROW1_TRAP_PENALTY_SEC = 15

/** F1 下拉三选项（GDD 02 §2.3 Row1） */
export type Row1Option = 'split-fill' | 'force-write' | 'merge-center'

export type Row1ChoiceResult = 'correct' | 'wrong' | 'trap'

export interface Row1State {
  /** A1 #结构损坏! 故障显示中（初始 true；选对后解除） */
  structureBroken: boolean
  /** 合并后居中陷阱已踩（批注泡显示用） */
  trapCommentShown: boolean
  /**
   * F1 下拉选择判定（手册 1.1 条件句）：
   * Row2（modules[1]）未拆 → 正确解 split-fill；已拆 → force-write。
   * correct：A1 修复 + 拆除 Row1；wrong：Row1 -20s；trap（merge-center）：全场 -15s。
   */
  chooseOption: (option: Row1Option) => Row1ChoiceResult
}

export const createRow1Slice: StateCreator<RootState, [], [], Row1State> = (set, get) => ({
  structureBroken: true,
  trapCommentShown: false,

  chooseOption: (option) => {
    const s = get()
    // 终局/已拆后下拉不可达，防御性 no-op（返回值仅占位，不施加任何惩罚）
    if (s.status !== 'playing' || !s.structureBroken) return 'wrong'

    if (option === 'merge-center') {
      set({ trapCommentShown: true })
      s.penalizeAll(ROW1_TRAP_PENALTY_SEC)
      return 'trap'
    }

    const row2Defused = s.modules[1]?.defused ?? false
    if (option === (row2Defused ? 'force-write' : 'split-fill')) {
      set({ structureBroken: false })
      s.defuseModule(1)
      return 'correct'
    }
    s.penalizeRow(1, ROW1_WRONG_PENALTY_SEC)
    return 'wrong'
  },
})
