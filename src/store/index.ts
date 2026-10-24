import { create } from 'zustand'
import { createSelectionSlice } from './selectionSlice'
import type { SelectionState } from './selectionSlice'
import { createSheetSlice } from './sheetSlice'
import type { SheetState } from './sheetSlice'

/**
 * 全局游戏状态根类型。
 * 后续票按 slice 扩展：倒计时 tick（timerSlice）、模块判定（modulesSlice）、
 * 惩罚结算（penaltySlice）等，在 create<RootState>() 中依次展开即可。
 */
export type RootState = SelectionState & SheetState

export const useGameStore = create<RootState>()((...a) => ({
  ...createSelectionSlice(...a),
  ...createSheetSlice(...a),
}))
