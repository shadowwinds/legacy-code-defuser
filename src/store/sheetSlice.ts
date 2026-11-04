import type { StateCreator } from 'zustand'
import type { RootState } from './index'

export type SheetId = 'sheet1' | 'sheet2'

export interface SheetState {
  /** 当前激活的 Sheet（Sheet1 网格 / Sheet2 手册） */
  activeSheet: SheetId
  setSheet: (sheet: SheetId) => void
  toggleSheet: () => void
  /** 【文件】后台视图（Backstage）是否打开；打开时游戏照跑 */
  backstageOpen: boolean
  setBackstage: (open: boolean) => void
}

export const createSheetSlice: StateCreator<RootState, [], [], SheetState> = (set) => ({
  activeSheet: 'sheet1',
  setSheet: (sheet) => set({ activeSheet: sheet }),
  toggleSheet: () =>
    set((s) => ({
      activeSheet: s.activeSheet === 'sheet1' ? 'sheet2' : 'sheet1',
      backstageOpen: false,
    })),
  backstageOpen: false,
  setBackstage: (open) => set({ backstageOpen: open }),
})
