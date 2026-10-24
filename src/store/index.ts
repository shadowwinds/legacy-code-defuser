import { create } from 'zustand'
import { createSelectionSlice } from './selectionSlice'
import { createSheetSlice } from './sheetSlice'
import { createEngineSlice } from './engineSlice'
import { createPenaltySlice } from './penaltySlice'
import { createRow5Slice } from './row5Slice'
import type { SelectionState } from './selectionSlice'
import type { SheetState } from './sheetSlice'
import type { EngineState } from './engineSlice'
import type { PenaltyState } from './penaltySlice'
import type { Row5State } from './row5Slice'

/**
 * 全局游戏状态根类型。
 * 后续票按 slice 扩展：模块判定（modulesSlice）等，
 * 在 create<RootState>() 中依次展开即可。
 */
export type RootState = SelectionState & SheetState & EngineState & PenaltyState & Row5State

export const useGameStore = create<RootState>()((...a) => ({
  ...createSelectionSlice(...a),
  ...createSheetSlice(...a),
  ...createEngineSlice(...a),
  ...createPenaltySlice(...a),
  ...createRow5Slice(...a),
}))
