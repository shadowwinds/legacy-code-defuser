export type RowKind = 'module' | 'dim' | 'decor'

export interface GridRow {
  /** 行号 1–8 */
  row: number
  /** 行首占位文本（模块行即模块名） */
  text: string
  /** module = 可交互模块行（Row1–5）；dim = 装饰灰行；decor = 普通装饰行 */
  kind: RowKind
  /** A 列单元格横向合并的列数（模拟"合并单元格"，如 Row1 合并 A–D） */
  span?: number
  /** E 列数据条静态填充宽度（%） */
  barWidth?: number
}

/**
 * 8 行网格骨架数据（issue #2 静态占位）。
 * 后续票的挂载位：Row1–Row5 的 module 行将替换为真实模块组件，
 * 可在本文件补充 moduleId 字段并让 Grid 按类型挂载。
 */
export const GRID_ROWS: GridRow[] = [
  { row: 1, text: '跨部门汇总合并单元格', kind: 'module', span: 4, barWidth: 62 },
  { row: 2, text: '防欠薪定时自爆网关', kind: 'module', barWidth: 38 },
  { row: 3, text: '乱码考古·口令验证', kind: 'module', barWidth: 81 },
  { row: 4, text: '财务对账平账脚本_勿动', kind: 'module', barWidth: 45 },
  { row: 5, text: '拜机房神兽重启仪式', kind: 'module', barWidth: 57 },
  { row: 6, text: 'left-pad #MISSING!', kind: 'dim', barWidth: 12 },
  { row: 7, text: 'final_final_v3 考古区', kind: 'decor', barWidth: 30 },
  { row: 8, text: '"别动它能跑"🐉', kind: 'decor', barWidth: 66 },
]
