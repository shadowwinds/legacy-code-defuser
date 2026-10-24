import { create } from 'zustand'
import { createSelectionSlice } from './selectionSlice'
import { createSheetSlice } from './sheetSlice'
import { createEngineSlice } from './engineSlice'
import { createPenaltySlice } from './penaltySlice'
import { createRow4Slice } from './row4Slice'
import type { SelectionState } from './selectionSlice'
import type { SheetState } from './sheetSlice'
import type { EngineState } from './engineSlice'
import type { PenaltyState } from './penaltySlice'
import type { Row4State } from './row4Slice'

/**
 * 全局游戏状态根类型。
 * 后续票按 slice 扩展：模块判定（modulesSlice）等，
 * 在 create<RootState>() 中依次展开即可。
 */
export type RootState = SelectionState & SheetState & EngineState & PenaltyState & Row4State

export const useGameStore = create<RootState>()((...a) => ({
  ...createSelectionSlice(...a),
  ...createSheetSlice(...a),
  ...createEngineSlice(...a),
  ...createPenaltySlice(...a),
  ...createRow4Slice(...a),
}))
