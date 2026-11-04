/**
 * v2 Row4 · 财务对账平账脚本_勿动（GDD 07 §7.3 Row4）。
 * 外观：G 列垃圾数据每局随机；状态栏统计方式随机为「求和」或「平均值」。
 * 规则：状态栏显示什么统计，就让那个统计等于目标值；目标值由时间场景决定（平日/周末 × 白天/深夜）。
 * 偷懒公式 `=目标-SUM(G2:G9)` 只在求和模式下有效。4 × 2 种答案，碰撞率 12.5%（可背型）。
 */
import { streamFor } from '../../lib/seed'
import { predicates, type Situation } from '../situation'

/** G 列单元格值：数字 / 空格(null) / Excel 错误值 / 偷懒公式格 */
export type GCellValue = number | null | '#DIV/0!' | '#VALUE!' | 'LAZY'

export type Row4Mode = 'sum' | 'avg'

export const ROW4_MODE_LABEL: Record<Row4Mode, string> = { sum: '求和', avg: '平均值' }

/** 祖传浮点污染数据池 */
const JUNK_POOL = [
  666.6, 77.00000000000001, 123.456, 9.999999999999998, 0.30000000000000004, 3.3000000000000003, 88.88, 250.25,
  1.1000000000000001, 42.42, 512.0000000000001, 13.37,
]

export interface Row4Appearance {
  mode: Row4Mode
  /** G1:G8 开局值（下标 = 行号 - 1）。结构同 v1：G4 #DIV/0!，G2/G6/G7 空，G8 在禁操行 */
  junk: GCellValue[]
}

export function row4Appearance(seed: string): Row4Appearance {
  const mode: Row4Mode = streamFor(seed, 'row4:mode').next() < 0.5 ? 'sum' : 'avg'
  const r = streamFor(seed, 'row4:junk')
  const pick = () => JUNK_POOL[r.int(JUNK_POOL.length)]
  return { mode, junk: [pick(), null, pick(), '#DIV/0!', pick(), null, null, pick()] }
}

/** 目标值：平日白天 1024 / 平日深夜 2048 / 周末白天 996 / 周末深夜 404 */
export function row4Target(s: Situation): number {
  if (predicates.weekend(s)) return predicates.night(s) ? 404 : 996
  return predicates.night(s) ? 2048 : 1024
}

export function row4Answer(s: Situation, a: Row4Appearance): { mode: Row4Mode; target: number } {
  return { mode: a.mode, target: row4Target(s) }
}

export const lazyFormulaFor = (target: number) => `=${target}-SUM(G2:G9)`

export const isGError = (c: GCellValue) => c === '#DIV/0!' || c === '#VALUE!'

/**
 * 状态栏统计值（Excel 语义：空格不计入平均值）。
 * 有错误格时返回 null（算不出）；平均值模式下没有数字时也返回 null。
 */
export function row4Stat(cells: readonly GCellValue[], mode: Row4Mode): number | null {
  if (cells.some(isGError)) return null
  const nums = cells.filter((c): c is number => typeof c === 'number')
  const sum = nums.reduce((a, b) => a + b, 0)
  if (mode === 'sum') return sum
  return nums.length === 0 ? null : sum / nums.length
}
