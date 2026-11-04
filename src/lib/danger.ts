/**
 * 危险度与活表格传染（GLOSSARY「危险度」「活表格」，#43 定稿 / #48）。
 * 纯函数：只驱动演出，不参与任何判定。
 */
import { streamFor } from './seed'

export interface DangerModule {
  row: number
  remaining: number
  defused: boolean
}

export interface DangerInput {
  modules: readonly DangerModule[]
  fuseRemaining: number
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * 危险度 = max(最危险的未拆模块 (45 − 剩余秒) / 45, 引信 (90 − 剩余秒) / 90)，0–1。
 * 五个模块全拆 = 炸弹已解除，危险度归零（引信不再有意义）。
 */
export function dangerOf({ modules, fuseRemaining }: DangerInput): number {
  if (modules.every((m) => m.defused)) return 0
  let d = clamp01((90 - fuseRemaining) / 90)
  for (const m of modules) {
    if (!m.defused) d = Math.max(d, clamp01((45 - m.remaining) / 45))
  }
  return d
}

/** 传染源：剩余秒数最少的未拆模块所在行；全部拆完时为 null */
export function hottestRow(modules: readonly DangerModule[]): number | null {
  let hottest: DangerModule | null = null
  for (const m of modules) {
    if (!m.defused && (hottest === null || m.remaining < hottest.remaining)) hottest = m
  }
  return hottest?.row ?? null
}

export type DangerLevel = 0 | 1 | 2 | 3

/** 分级：L0 < 0.3 ≤ L1 < 0.6 ≤ L2 < 0.85 ≤ L3 */
export function dangerLevel(danger: number): DangerLevel {
  if (danger >= 0.85) return 3
  if (danger >= 0.6) return 2
  if (danger >= 0.3) return 1
  return 0
}

/** L3 列标损坏顺序：从 E 列（倒计时）向两边 */
const REF_HEADER_ORDER = [5, 4, 6, 3, 7, 2, 8, 1]

/** L3 时变成 `#REF!` 的列标（列号）：刚进 L3 坏 1 列，危险度拉满时 8 列全坏 */
export function refHeaderCols(danger: number): number[] {
  if (dangerLevel(danger) < 3) return []
  const count = 1 + Math.floor(clamp01((danger - 0.85) / 0.15) * (REF_HEADER_ORDER.length - 1))
  return REF_HEADER_ORDER.slice(0, count)
}

// ———————————————————— 错误值传染 ————————————————————

/** 网格列数（A–H） */
const COLS = 8
/** 真实内容行数（Row1–Row8）；往下是铺满屏幕用的空行 */
const CONTENT_ROWS = 8

/**
 * 真实 8 行里可被传染的空白列（1-based 列号）。
 * 模块行只让空白列被传染，不盖住模块本身的信息：A 列是行标题、E 列是倒计时数据条、
 * F 列挂模块 UI、D3 是乱码考古、H3 是 v2 口令输入框（#52）、G 列整列是 Row4 的数据区（G1:G8）。
 */
const BLANK_COLS: Record<number, readonly number[]> = {
  1: [8],
  2: [8],
  3: [3],
  4: [3, 8],
  5: [3, 8],
  6: [2, 3, 4, 5, 6, 8],
  7: [2, 3, 4, 5, 6, 8],
  8: [2, 3, 4, 5, 6, 8],
}

/** 传染出现的错误值文本（Excel 错误值 + 经典乱码） */
const ERROR_TEXTS = ['#REF!', '#N/A', '#VALUE!', '#NULL!', '#DIV/0!', '锟斤拷', '####', '#NAME?', '烫烫烫', '#SPILL!']

export interface SheetCell {
  /** 行号（1 起；> 8 为铺满屏幕的空行） */
  row: number
  /** 列号 1–8（A–H） */
  col: number
}

export interface InfectedCell extends SheetCell {
  /** 该格显示的错误值 */
  text: string
}

export interface InfectionInput {
  danger: number
  /** 传染源行（hottestRow） */
  hottestRow: number | null
  /** 已拆模块行：刚被擦净，最后才会再被传染 */
  cleanRows: readonly number[]
  /** 屏幕上的总行数（真实 8 行 + 补出的空行） */
  totalRows: number
  /** 本局种子：决定传染格子的先后与错误文本 */
  seed: string
}

/** 传染比例 = ((危险度 − 0.3) / 0.7)^2.2；L0 为 0 */
export function infectionRatio(danger: number): number {
  if (dangerLevel(danger) === 0) return 0
  return clamp01((danger - 0.3) / 0.7) ** 2.2
}

function candidates(totalRows: number): SheetCell[] {
  const out: SheetCell[] = []
  for (let row = 1; row <= totalRows; row++) {
    const cols = row <= CONTENT_ROWS ? (BLANK_COLS[row] ?? []) : ALL_COLS
    for (const col of cols) out.push({ row, col })
  }
  return out
}
const ALL_COLS = Array.from({ length: COLS }, (_, i) => i + 1)

/**
 * 从最危险的行向外挑出被传染的格子（按传染先后排序）。
 * 同一种子、同一传染源下，危险度越高挑出的集合只增不减——已感染的格子不会因危险度上升而换位，
 * 演出层据此只给新出现的格子播入场动画。
 */
export function pickInfectedCells({ danger, hottestRow, cleanRows, totalRows, seed }: InfectionInput): InfectedCell[] {
  const pool = candidates(totalRows)
  const n = Math.round(infectionRatio(danger) * pool.length)
  if (n === 0 || hottestRow === null) return []
  const noise = noiseFor(seed)
  return pool
    .map((c) => {
      const { jitter, textIndex } = noise(c)
      // 离传染源越近越先感染；横向从 E 列（倒计时）向两侧；种子噪声打散边缘；
      // 刚拆的行排到最后（被擦净），它的上下邻行也往后推一点（「附近的传染格子随之退去」）
      const rank =
        Math.abs(c.row - hottestRow) * 1.6 +
        Math.abs(c.col - 5) * 0.5 +
        jitter * 3 +
        cleanPenalty(c.row, cleanRows)
      return { cell: { ...c, text: ERROR_TEXTS[textIndex] }, rank }
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, n)
    .map((r) => r.cell)
}

/** 已拆行本身：排在所有格子之后 */
const CLEAN_ROW_PENALTY = 1000
/** 已拆行的上下邻行：往后推约两行的距离 */
const CLEAN_NEIGHBOR_PENALTY = 3

function cleanPenalty(row: number, cleanRows: readonly number[]): number {
  let penalty = 0
  for (const clean of cleanRows) {
    const dist = Math.abs(row - clean)
    if (dist === 0) return CLEAN_ROW_PENALTY
    if (dist === 1) penalty = CLEAN_NEIGHBOR_PENALTY
  }
  return penalty
}

/** 噪声表覆盖的最大行数（远超任何屏幕能补出的空行数） */
const NOISE_ROWS = 200

interface CellNoise {
  jitter: number
  textIndex: number
}

let noiseCache: { seed: string; table: CellNoise[] } | null = null

/**
 * 本局每个格子的固定噪声（传染先后的抖动 + 错误文本）。
 * 按行列顺序一次性从 `live-sheet` 随机流生成，与候选集合无关——屏幕行数变了，同一格的噪声不变。
 */
function noiseFor(seed: string): (cell: SheetCell) => CellNoise {
  if (noiseCache?.seed !== seed) {
    const rng = streamFor(seed, 'live-sheet')
    const table: CellNoise[] = []
    for (let i = 0; i < NOISE_ROWS * COLS; i++) {
      table.push({ jitter: rng.next(), textIndex: rng.int(ERROR_TEXTS.length) })
    }
    noiseCache = { seed, table }
  }
  const { table } = noiseCache
  return ({ row, col }) => table[((row - 1) % NOISE_ROWS) * COLS + (col - 1)]
}
