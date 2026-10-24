import type { ModuleState } from '../store/engineSlice'
import { PASSCODES } from '../data/passcodes'

/** 开局抖动：在 base 上做 ±10% 均匀随机（每局不同） */
export function jitterSeconds(base: number, jitterRatio = 0.1): number {
  return base * (1 + (Math.random() * 2 - 1) * jitterRatio)
}

/** 由各模块基准秒数生成开局模块状态（Row1–Row5，顺序即行号 1–5） */
export function createInitialModules(baseSeconds: readonly number[]): ModuleState[] {
  return baseSeconds.map((base, i) => {
    const initial = jitterSeconds(base)
    return { row: i + 1, initial, remaining: initial, defused: false }
  })
}

/** 口令 5 选 1：返回附录中的随机行下标 */
export function pickPasscodeIndex(): number {
  return Math.floor(Math.random() * PASSCODES.length)
}
