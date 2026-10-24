import { create } from 'zustand'
import { createSelectionSlice } from './selectionSlice'
import { createSheetSlice } from './sheetSlice'
import { createEngineSlice } from './engineSlice'
import { createPenaltySlice } from './penaltySlice'
import { createRow4Slice } from './row4Slice'
import { createRow2Slice } from './row2Slice'
import { createRow5Slice } from './row5Slice'
import { createRow3Slice } from './row3Slice'
import { createSkillSlice } from './skillSlice'
import { createRow1Slice } from './row1Slice'
import type { SelectionState } from './selectionSlice'
import type { SheetState } from './sheetSlice'
import type { EngineState } from './engineSlice'
import type { PenaltyState } from './penaltySlice'
import type { Row4State } from './row4Slice'
import type { Row2State } from './row2Slice'
import type { Row5State } from './row5Slice'
import type { Row3State } from './row3Slice'
import type { SkillState } from './skillSlice'
import type { Row1State } from './row1Slice'

/**
 * 全局游戏状态根类型。
 * 后续票按 slice 扩展，在 create<RootState>() 中依次展开即可。
 */
export type RootState = SelectionState &
  SheetState &
  EngineState &
  PenaltyState &
  Row4State &
  Row2State &
  Row5State &
  Row3State &
  SkillState &
  Row1State

export const useGameStore = create<RootState>()((...a) => ({
  ...createSelectionSlice(...a),
  ...createSheetSlice(...a),
  ...createEngineSlice(...a),
  ...createPenaltySlice(...a),
  ...createRow4Slice(...a),
  ...createRow2Slice(...a),
  ...createRow5Slice(...a),
  ...createRow3Slice(...a),
  ...createSkillSlice(...a),
  ...createRow1Slice(...a),
}))
