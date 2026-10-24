import type { StateCreator } from 'zustand'
import type { RootState } from './index'
import { createInitialModules, pickPasscodeIndex } from '../lib/randomizer'

/** 全局引信总时长（秒）：16:56:00 → 17:00:00 */
export const FUSE_INITIAL_SEC = 240

/** 各模块基准倒计时（秒），下标 = 行号 - 1（GDD §2.8：80/70/90/60/100，±10% 抖动在 randomizer） */
export const MODULE_BASE_SEC: readonly number[] = [80, 70, 90, 60, 100]

/** 模块短名（爆炸文案用），键 = 行号 */
export const MODULE_NAMES: Record<number, string> = {
  1: '跨部门汇总',
  2: '防欠薪网关',
  3: '乱码考古',
  4: '平账脚本',
  5: '重启仪式',
}

export type GameStatus = 'playing' | 'exploded' | 'won'

export interface ModuleState {
  /** 行号 1–5 */
  row: number
  /** 当前剩余秒数（float，100ms tick 递减） */
  remaining: number
  /** 本局初始秒数（已含 ±10% 抖动） */
  initial: number
  defused: boolean
}

export interface EngineState {
  /** 全局引信剩余秒数 */
  fuseRemaining: number
  /** Row1–Row5 模块状态，下标 = 行号 - 1 */
  modules: ModuleState[]
  /** playing → exploded / won；终局后 tick 停、API 锁死 */
  status: GameStatus
  /** 终局文案（爆炸/通关） */
  endReason: string | null
  /** 本局生效的口令附录行下标（0–4，Row3 后续票接 UI） */
  passcodeIndex: number
  /** 引擎 100ms tick（由 useGameEngine 统一驱动，组件禁止自开 interval） */
  tick: () => void
  /** 指定行扣时（已拆模块免疫；clamp 0，归零即爆炸） */
  penalizeRow: (row: number, sec: number) => void
  /** 全场未拆模块扣时（任一归零即爆炸） */
  penalizeAll: (sec: number) => void
  /** 拆除模块；第 5 个拆完 → 通关 */
  defuseModule: (row: number) => void
}

/** 上次 tick 时间戳（模块级，不入 state 以免多余渲染）；store 创建即起表 */
let lastTickAt = Date.now()

const explode = (row: number) => `${MODULE_NAMES[row]} 当场爆炸。`
const FUSE_REASON = '17:00 了，引信烧完，全表爆炸。'
const WIN_REASON = '17:00 准点跑路，下班！'

export const createEngineSlice: StateCreator<RootState, [], [], EngineState> = (set, get) => ({
  fuseRemaining: FUSE_INITIAL_SEC,
  modules: createInitialModules(MODULE_BASE_SEC),
  status: 'playing',
  endReason: null,
  passcodeIndex: pickPasscodeIndex(),

  tick: () => {
    const now = Date.now()
    const deltaSec = (now - lastTickAt) / 1000
    lastTickAt = now

    const s = get()
    if (s.status !== 'playing' || deltaSec <= 0) return

    const fuseRemaining = Math.max(0, s.fuseRemaining - deltaSec)
    let explodedRow = 0
    const modules = s.modules.map((m) => {
      if (m.defused) return m
      const remaining = Math.max(0, m.remaining - deltaSec)
      if (remaining <= 0 && explodedRow === 0) explodedRow = m.row
      return { ...m, remaining }
    })

    if (fuseRemaining <= 0) {
      set({ fuseRemaining: 0, modules, status: 'exploded', endReason: FUSE_REASON })
    } else if (explodedRow > 0) {
      set({ fuseRemaining, modules, status: 'exploded', endReason: explode(explodedRow) })
    } else {
      set({ fuseRemaining, modules })
    }
  },

  penalizeRow: (row, sec) => {
    const s = get()
    if (s.status !== 'playing' || row < 1 || row > s.modules.length) return
    const idx = row - 1
    const target = s.modules[idx]
    if (target.defused) return

    const remaining = Math.max(0, target.remaining - sec)
    const modules = s.modules.map((m, i) => (i === idx ? { ...m, remaining } : m))
    if (remaining <= 0) {
      set({ modules, status: 'exploded', endReason: explode(row) })
    } else {
      set({ modules })
    }
  },

  penalizeAll: (sec) => {
    const s = get()
    if (s.status !== 'playing') return

    let explodedRow = 0
    const modules = s.modules.map((m) => {
      if (m.defused) return m
      const remaining = Math.max(0, m.remaining - sec)
      if (remaining <= 0 && explodedRow === 0) explodedRow = m.row
      return { ...m, remaining }
    })

    if (explodedRow > 0) {
      set({ modules, status: 'exploded', endReason: explode(explodedRow) })
    } else {
      set({ modules })
    }
  },

  defuseModule: (row) => {
    const s = get()
    if (s.status !== 'playing' || row < 1 || row > s.modules.length) return
    const idx = row - 1
    if (s.modules[idx].defused) return

    const modules = s.modules.map((m, i) => (i === idx ? { ...m, defused: true } : m))
    if (modules.every((m) => m.defused)) {
      set({ modules, status: 'won', endReason: WIN_REASON })
    } else {
      set({ modules })
    }
  },
})
