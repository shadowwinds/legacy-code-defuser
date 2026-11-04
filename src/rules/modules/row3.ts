/**
 * v2 Row3 · 乱码考古·口令验证（GDD 07 §7.3 Row3）。
 * 外观：口令日期从附录 A 的 12 行里抽 1 行（种子流 row3:passcode）；
 * 开关：版本号末位单数 → 口令填 F3，双数 → 填 H3。12 × 2 种答案，碰撞率 ≈ 4.2%（必查型）。
 */
import type { PasscodeEntry } from '../../data/passcodes'
import { streamFor } from '../../lib/seed'
import { predicates, type Situation } from '../situation'

/** v2 附录 A：序列值与日期严格对应（Excel 1900 日期系统，小数部分只是时刻） */
export const PASSCODES_V2: readonly PasscodeEntry[] = [
  { serial: 42009, date: '2015-01-05', passcode: 'Q3_OKR_别问' },
  { serial: 42443.5, date: '2016-03-14', passcode: 'left_pad_同款' },
  { serial: 42738, date: '2017-01-03', passcode: '老板生日快乐' },
  { serial: 43103, date: '2018-01-03', passcode: '跑路勿念' },
  { serial: 43468.5, date: '2019-01-03', passcode: '锟斤拷烫烫烫' },
  { serial: 43762, date: '2019-10-24', passcode: '程序员节加班' },
  { serial: 43890.5, date: '2020-02-29', passcode: '闰年专属BUG' },
  { serial: 44540, date: '2021-12-10', passcode: 'log4j_别升级' },
  { serial: 44895, date: '2022-11-30', passcode: '让AI写的' },
  { serial: 45017.5, date: '2023-04-01', passcode: '这不是玩笑' },
  { serial: 45492, date: '2024-07-19', passcode: '蓝屏同款' },
  { serial: 45658, date: '2025-01-01', passcode: 'Y2K25_没事' },
]

export type Row3Cell = 'F3' | 'H3'

export interface Row3Appearance {
  /** PASSCODES_V2 下标 */
  index: number
}

export function row3Appearance(seed: string): Row3Appearance {
  return { index: streamFor(seed, 'row3:passcode').int(PASSCODES_V2.length) }
}

/** 口令该填的格子 */
export const row3Cell = (s: Situation): Row3Cell => (predicates.versionOdd(s) ? 'F3' : 'H3')

export function row3Answer(s: Situation, a: Row3Appearance): { passcode: string; cell: Row3Cell } {
  return { passcode: PASSCODES_V2[a.index].passcode, cell: row3Cell(s) }
}

/** 本局生效的口令表：v2 用 12 行附录 A，v1 沿用 5 行 */
export const passcodeTable = (v2: boolean, v1: readonly PasscodeEntry[]): readonly PasscodeEntry[] =>
  v2 ? PASSCODES_V2 : v1
