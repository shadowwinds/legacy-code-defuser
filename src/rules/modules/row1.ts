/**
 * v2 Row1 · 跨部门汇总合并单元格（GDD 07 §7.3 Row1）。
 * 外观：A1 报错码 5 选 1；规则：按报错码分节，每节 1 个外壳开关（KTaNE Wires 式），理论碰撞率 20%。
 */
import { streamFor } from '../../lib/seed'
import { predicates, type Situation } from '../situation'

export const ROW1_CODES = ['#结构损坏!', '#合并冲突!', '#排序失败!', '#筛选失效!', '#引用断裂!'] as const
export type Row1Code = (typeof ROW1_CODES)[number]

/** 合法选项 5 个；merge-center 是陷阱（全场惩罚） */
export type Row1V2Answer = 'split-fill' | 'split-nofill' | 'force-write' | 'center-across' | 'to-table'

export const ROW1_OPTION_LABELS: Record<Row1V2Answer | 'merge-center', string> = {
  'split-fill': '[拆分并填充值]',
  'split-nofill': '[拆分不填充]',
  'force-write': '[保留合并强行写入]',
  'center-across': '[跨列居中]',
  'to-table': '[转为表格]',
  'merge-center': '[合并后居中]',
}

type Predicate = keyof typeof predicates

/** 规则表：报错码 → (开关谓词, 否, 是) */
export const ROW1_TABLE: Record<Row1Code, { when: Predicate; no: Row1V2Answer; yes: Row1V2Answer }> = {
  '#结构损坏!': { when: 'macroBar', no: 'split-fill', yes: 'split-nofill' },
  '#合并冲突!': { when: 'versionOdd', no: 'force-write', yes: 'split-fill' },
  '#排序失败!': { when: 'weekend', no: 'center-across', yes: 'to-table' },
  '#筛选失效!': { when: 'night', no: 'to-table', yes: 'force-write' },
  '#引用断裂!': { when: 'pastPayday', no: 'split-nofill', yes: 'center-across' },
}

export interface Row1Appearance {
  code: Row1Code
}

export function row1Appearance(seed: string): Row1Appearance {
  return { code: ROW1_CODES[streamFor(seed, 'row1:code').int(ROW1_CODES.length)] }
}

export function row1Answer(situation: Situation, appearance: Row1Appearance): Row1V2Answer {
  const rule = ROW1_TABLE[appearance.code]
  return predicates[rule.when](situation) ? rule.yes : rule.no
}
