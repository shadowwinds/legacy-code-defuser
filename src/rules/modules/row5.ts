/**
 * v2 Row5 · 拜机房神兽重启仪式（GDD 07 §7.3 Row5）。
 * 外观：假死时 F5 报错码 5 选 1（种子流 row5:code）；首次假死时刻 35–55 秒随机（row5:first）。
 * 规则：按报错码分节，每节 1 个外壳开关，答案均匀 2/10，碰撞率 20%。
 */
import { streamFor } from '../../lib/seed'
import { predicates, type Situation } from '../situation'

export const ROW5_CODES = ['#STUCK!', '#TIMEOUT!', '#OOM!', '#EPIPE!', '#HANG!'] as const
export type Row5Code = (typeof ROW5_CODES)[number]

export type Row5Ritual = 'restart' | 'unplug' | 'clear-cache' | 'rollback' | 'incense'

export const ROW5_RITUAL_LABELS: Record<Row5Ritual, string> = {
  restart: '[重启服务]',
  unplug: '[拔网线]',
  'clear-cache': '[清缓存]',
  rollback: '[回滚到昨天]',
  incense: '[上香]',
}

type Predicate = keyof typeof predicates

export const ROW5_TABLE: Record<Row5Code, { when: Predicate; no: Row5Ritual; yes: Row5Ritual }> = {
  '#STUCK!': { when: 'weekend', no: 'restart', yes: 'incense' },
  '#TIMEOUT!': { when: 'macroBar', no: 'unplug', yes: 'clear-cache' },
  '#OOM!': { when: 'versionOdd', no: 'clear-cache', yes: 'rollback' },
  '#EPIPE!': { when: 'night', no: 'unplug', yes: 'incense' },
  '#HANG!': { when: 'pastPayday', no: 'rollback', yes: 'restart' },
}

export interface Row5Appearance {
  code: Row5Code
  /** 首次假死距开局毫秒数（35–55 秒） */
  firstStuckMs: number
}

export function row5Appearance(seed: string): Row5Appearance {
  return {
    code: ROW5_CODES[streamFor(seed, 'row5:code').int(ROW5_CODES.length)],
    firstStuckMs: (35 + streamFor(seed, 'row5:first').int(21)) * 1000,
  }
}

export function row5Answer(s: Situation, a: Pick<Row5Appearance, 'code'>): Row5Ritual {
  const rule = ROW5_TABLE[a.code]
  return predicates[rule.when](s) ? rule.yes : rule.no
}
