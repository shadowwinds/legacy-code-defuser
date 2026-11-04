/**
 * v2 Row2 · 防欠薪定时自爆网关（GDD 07 §7.3 Row2）。
 * 外观：守卫变量 5 选 1；解法：把危险值改成「骗它的值」，平日/周末各一套（10 种答案，碰撞率 10%）。
 * IFERROR 彩蛋只在「有宏警告条 且 作者是外包-张三」时生效（照搬成功率 8.3%）。
 */
import { streamFor } from '../../lib/seed'
import { predicates, type Situation } from '../situation'

export const ROW2_GUARDS = [
  { guard: 'ENV', danger: 'PRODUCTION', weekday: 'LOCALHOST', weekend: 'STAGING', note: '生产环境定时自爆，防拖欠尾款' },
  { guard: 'PAYDAY', danger: '未结清', weekday: '已结清', weekend: '下周结', note: '尾款不到账就炸，别怪我' },
  { guard: 'CLIENT', danger: '甲方', weekday: '自己人', weekend: '老板亲戚', note: '甲方再改需求就炸' },
  { guard: 'REGION', danger: 'PROD-CN', weekday: 'DEV-HOME', weekend: 'MARS', note: '只在国内生产炸，海外随意' },
  { guard: 'BUILD', danger: 'RELEASE', weekday: 'DEBUG', weekend: 'SNAPSHOT', note: '正式包自带惊喜' },
] as const

export type Row2Guard = (typeof ROW2_GUARDS)[number]['guard']

export interface Row2Appearance {
  guard: Row2Guard
}

const ruleOf = (guard: Row2Guard) => ROW2_GUARDS.find((g) => g.guard === guard)!

export function row2Appearance(seed: string): Row2Appearance {
  return { guard: ROW2_GUARDS[streamFor(seed, 'row2:guard').int(ROW2_GUARDS.length)].guard }
}

/** 本局「骗它的值」 */
export function row2Answer(situation: Situation, appearance: Row2Appearance): string {
  const rule = ruleOf(appearance.guard)
  return predicates.weekend(situation) ? rule.weekend : rule.weekday
}

/** IFERROR 彩蛋本局是否有效 */
export const row2IferrorValid = (s: Situation) => predicates.macroBar(s) && predicates.authorOutsourcer(s)

const formula = (guard: string, value: string) => `=IF(${guard}="${value}", CRASH_NOW(), "SAFE")`

export const row2LockedFormula = (a: Row2Appearance) => {
  const rule = ruleOf(a.guard)
  return `${formula(rule.guard, rule.danger)}  // ${rule.note}`
}

export const row2UnlockedFormula = (a: Row2Appearance, s: Situation) => formula(a.guard, row2Answer(s, a))

/** 归一化：去 // 注释、单引号→双引号、转大写、去全部空白 */
const squash = (text: string) =>
  text
    .replace(/\/\/.*$/gm, '')
    .replace(/'/g, '"')
    .toUpperCase()
    .replace(/\s+/g, '')

const squashedIf = (guard: string, value: string) => squash(formula(guard, value))

export type Row2Verdict = 'ok' | 'iferror' | 'fail'

export function judgeRow2(text: string, situation: Situation, appearance: Row2Appearance): Row2Verdict {
  const t = squash(text)
  const rule = ruleOf(appearance.guard)
  const answer = row2Answer(situation, appearance)

  const wrapped = t.match(/^=IFERROR\(=?(.*),"200OK"\)$/)
  if (wrapped) {
    const inner = `=${wrapped[1]}`
    const innerOk = inner === squashedIf(rule.guard, rule.danger) || inner === squashedIf(rule.guard, answer)
    return innerOk && row2IferrorValid(situation) ? 'iferror' : 'fail'
  }
  return t === squashedIf(rule.guard, answer) ? 'ok' : 'fail'
}
