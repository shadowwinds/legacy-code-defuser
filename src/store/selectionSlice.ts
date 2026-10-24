import type { StateCreator } from 'zustand'
import type { RootState } from './index'

export interface SelectionState {
  /** 选中行（1–8） */
  selectedRow: number
  /** 选中列（1–8）；null 表示整行选中（点击行号） */
  selectedCol: number | null
  selectCell: (row: number, col: number) => void
  selectRow: (row: number) => void
}

export const createSelectionSlice: StateCreator<RootState, [], [], SelectionState> = (set) => ({
  selectedRow: 1,
  selectedCol: 1,
  selectCell: (row, col) => set({ selectedRow: row, selectedCol: col }),
  selectRow: (row) => set({ selectedRow: row, selectedCol: null }),
})
