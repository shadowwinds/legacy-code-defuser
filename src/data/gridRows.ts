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
  /** 单元格批注文案（红三角标记，hover 弹出）；缺省无批注 */
  comment?: string
}

/**
 * 8 行网格骨架数据。
 * 后续票的挂载位：Row1–Row5 的 module 行将替换为真实模块组件，
 * 可在本文件补充 moduleId 字段并让 Grid 按类型挂载。
 */
export const GRID_ROWS: GridRow[] = [
  { row: 1, text: '跨部门汇总合并单元格', kind: 'module', span: 4 },
  { row: 2, text: '防欠薪定时自爆网关', kind: 'module' },
  { row: 3, text: '乱码考古·口令验证', kind: 'module' },
  {
    row: 4,
    text: '财务对账平账脚本_勿动',
    kind: 'module',
    comment: '兄弟，这脚本有祖传浮点精度 Bug，快炸的时候千万别改代码，凑数就行。——隔壁组 2019',
  },
  { row: 5, text: '拜机房神兽重启仪式', kind: 'module' },
  {
    row: 6,
    text: 'left-pad #MISSING!',
    kind: 'dim',
    comment: '2016-04-06 作者跑路撤包，全网瘫痪 2.5 小时。勿删，删了 build 不过。——老王',
  },
  { row: 7, text: 'final_final_v3 考古区', kind: 'decor' },
  {
    row: 8,
    text: '"别动它能跑"🐉',
    kind: 'decor',
    comment: '我不确定它为什么能跑，但删了它整个公司会停摆。——老王 2013',
  },
]
