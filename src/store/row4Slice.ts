import type { StateCreator } from 'zustand'
import type { RootState } from './index'
import { getRunConfig } from '../lib/seed'
import {
  ROW4_MODE_LABEL,
  isGError,
  lazyFormulaFor,
  row4Appearance,
  row4Stat,
  row4Target,
  type GCellValue,
  type Row4Mode,
} from '../rules/modules/row4'
import { createSituation } from '../rules/situation'

export type { GCellValue } from '../rules/modules/row4'

/** 平账目标：G 列求和 = 1024 即账平（GDD 02 §2.3 Row4，数值写死） */
export const RECON_TARGET = 1024
/** Edge A 连坐量：失衡每满 10s → Row2/Row3 各 -15s（GDD 02 §2.5） */
export const EDGE_A_SEC = 15
/** Edge A 失衡连坐阈值（ms） */
export const EDGE_A_THRESHOLD_MS = 10_000
/** 彩蛋批注自动消失时长（ms） */
export const LAZY_EGG_MS = 4000
/** 偷懒公式（检测文本，大小写不敏感） */
export const LAZY_FORMULA = '=1024-SUM(G2:G9)'
/** 平账判定容差：浮点污染数据下玩家只能"凑数"，0.001 内视为账平 */
export const RECON_EPSILON = 0.001

/** 开局垃圾数据（下标 = 行号 - 1）：祖传浮点污染 + #DIV/0! 故障格 + Row8 禁操格 */
const INITIAL_G_CELLS: GCellValue[] = [
  666.6,
  null,
  77.00000000000001,
  '#DIV/0!',
  123.456,
  null,
  null,
  9.999999999999998,
]

/** v2：本局外观与目标（GDD 07 §7.3 Row4）；v1 固定求和 1024、固定垃圾数据 */
const V2 = getRunConfig().v2
const APPEARANCE = V2 ? row4Appearance(getRunConfig().seed) : null
const TARGET = V2 ? row4Target(createSituation(getRunConfig().seed)) : RECON_TARGET

export interface Row4State {
  /** 状态栏统计方式（v1 恒为求和） */
  row4Mode: Row4Mode
  /** 本局平账目标值（v1 恒为 1024） */
  row4Target: number
  /** G 列 8 格（Row1–Row8），下标 = 行号 - 1 */
  gCells: GCellValue[]
  /** 是否存在错误格（#DIV/0!/#VALUE!）：监控脚本算不出数，状态栏显示「求和: ≠1024」 */
  gHasError: boolean
  /** G 列数字格求和（错误格不计）；v2 平均值模式下是平均值 */
  gSum: number
  /** 是否已账平（凑够 1024 或偷懒公式，均已触发 defuseModule(4)） */
  gBalanced: boolean
  /**
   * 玩家是否动过 G 列。Edge A 失衡起点语义（#22）：初始 #DIV/0! 是"祖传乱账"
   * 而非玩家过失，未动过手不连坐；首次 setGCell 后失衡判定才生效。
   */
  touched: boolean
  /** 偷懒彩蛋批注触发序号（0 = 未触发过；组件订阅序号弹泡） */
  lazyEggSeq: number
  /** 彩蛋批注所在格下标（定位批注泡） */
  lazyEggCell: number | null
  /** 提交 G 列格子编辑（空串=删数；数字=填数；偷懒公式=彩蛋过关） */
  setGCell: (idx: number, raw: string) => void
}

/**
 * 状态栏统计文案（StatusBar 唯一消费点）。
 * v1（GDD 02 §2.3）：初始 #DIV/0! 时显示「求和: ≠1024」。
 * v2：不泄露目标值——算不出时显示「求和/平均值: #DIV/0!」。
 */
export function reconSumLabel(
  s: Pick<Row4State, 'gHasError' | 'gSum' | 'gBalanced' | 'gCells' | 'row4Mode' | 'row4Target'>,
): string {
  if (getRunConfig().v2) {
    const name = ROW4_MODE_LABEL[s.row4Mode]
    if (s.gBalanced) return `${name}: ${s.row4Target}`
    const v = row4Stat(s.gCells, s.row4Mode)
    return v === null ? `${name}: #DIV/0!` : `${name}: ${Math.round(v * 1000) / 1000}`
  }
  if (s.gBalanced) return `求和: ${RECON_TARGET}`
  if (s.gHasError) return '求和: ≠1024'
  return `求和: ${Math.round(s.gSum * 1000) / 1000}`
}

export const createRow4Slice: StateCreator<RootState, [], [], Row4State> = (set, get) => ({
  row4Mode: APPEARANCE?.mode ?? 'sum',
  row4Target: TARGET,
  gCells: APPEARANCE?.junk ?? INITIAL_G_CELLS,
  gHasError: true,
  gSum: 0,
  gBalanced: false,
  touched: false,
  lazyEggSeq: 0,
  lazyEggCell: null,

  setGCell: (idx, raw) => {
    const s = get()
    if (s.status !== 'playing' || s.gBalanced) return
    if (idx < 0 || idx >= INITIAL_G_CELLS.length) return

    const trimmed = raw.trim()
    const cells = [...s.gCells]

    // 偷懒公式彩蛋：直接过关 + 弹批注「外包本人吧？」（GDD 02 §2.3 预期彩蛋）。
    // 糊弄语义：错误格一并糊掉，过关后 G 列无 #DIV/0!/#VALUE! 残留（#24）
    // v2：偷懒公式写本局目标值，且只在求和模式下有效（平均值模式下按非数字处理 → #VALUE!）
    const lazy = V2 ? lazyFormulaFor(s.row4Target) : LAZY_FORMULA
    const lazyOk = !V2 || s.row4Mode === 'sum'
    if (lazyOk && trimmed.toLowerCase() === lazy.toLowerCase()) {
      cells[idx] = 'LAZY'
      const cleaned = cells.map((c) => (isGError(c) ? null : c))
      set({
        gCells: cleaned,
        gHasError: false,
        gSum: s.row4Target,
        gBalanced: true,
        touched: true,
        lazyEggSeq: s.lazyEggSeq + 1,
        lazyEggCell: idx,
      })
      s.defuseModule(4)
      return
    }

    let v: GCellValue
    if (trimmed === '') v = null
    else if (Number.isFinite(Number(trimmed))) v = Number(trimmed)
    else v = '#VALUE!'

    cells[idx] = v
    const hasError = cells.some(isGError)
    const stat = row4Stat(cells, s.row4Mode)
    const sum = stat ?? 0
    const balanced = !hasError && stat !== null && Math.abs(stat - s.row4Target) < RECON_EPSILON

    if (balanced) {
      // GDD 02 §2.3：凑到 1024 = 过关（defuseModule 内部倒计时回满 + 标记已拆）
      set({ gCells: cells, gHasError: false, gSum: s.row4Target, gBalanced: true, touched: true })
      s.defuseModule(4)
    } else {
      set({ gCells: cells, gHasError: hasError, gSum: sum, touched: true })
    }
  },
})
