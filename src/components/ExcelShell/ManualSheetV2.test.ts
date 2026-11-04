import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { ROW1_OPTION_LABELS, ROW1_TABLE } from '../../rules/modules/row1'
import { ROW2_GUARDS } from '../../rules/modules/row2'
import { PASSCODES_V2 } from '../../rules/modules/row3'
import { ROW5_RITUAL_LABELS, ROW5_TABLE } from '../../rules/modules/row5'
import { PREDICATE_MANUAL } from '../../rules/situation'
import { ManualSheetV2 } from './ManualSheetV2'

const html = renderToStaticMarkup(createElement(ManualSheetV2))
const text = html.replace(/<[^>]+>/g, '|')
const strip = (label: string) => label.replace(/^\[|\]$/g, '')

/** 一行表格的单元格文本（按 | 切开去空） */
const rows = () =>
  [...html.matchAll(/<tr[^>]*>(.*?)<\/tr>/g)].map((m) =>
    [...m[1].matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/g)].map((c) =>
      c[1].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
    ),
  )

test('1.1 合并单元格：规则表逐格与引擎一致', () => {
  for (const [code, rule] of Object.entries(ROW1_TABLE)) {
    const row = rows().find((r) => r[0] === code)!
    expect(row, code).toEqual([
      code,
      PREDICATE_MANUAL[rule.when as keyof typeof PREDICATE_MANUAL].question,
      strip(ROW1_OPTION_LABELS[rule.no]),
      strip(ROW1_OPTION_LABELS[rule.yes]),
    ])
  }
  expect(text).toContain('合并后居中')
})

test('1.2 防欠薪网关：守卫表逐格与引擎一致', () => {
  for (const g of ROW2_GUARDS) {
    expect(rows().find((r) => r[0] === g.guard)).toEqual([g.guard, `"${g.danger}"`, `"${g.weekday}"`, `"${g.weekend}"`])
  }
})

test('1.4 平账目标：平日/周末 × 白天/深夜', () => {
  expect(rows().find((r) => r[0] === '平日')).toEqual(['平日', '1024', '2048'])
  expect(rows().find((r) => r[0] === '周末')).toEqual(['周末', '996', '404'])
})

test('1.5 重启仪式：规则表逐格与引擎一致', () => {
  for (const [code, rule] of Object.entries(ROW5_TABLE)) {
    expect(rows().find((r) => r[0] === code)).toEqual([
      code,
      PREDICATE_MANUAL[rule.when as keyof typeof PREDICATE_MANUAL].question,
      strip(ROW5_RITUAL_LABELS[rule.no]),
      strip(ROW5_RITUAL_LABELS[rule.yes]),
    ])
  }
})

test('附录 A：12 行口令（左右各半）', () => {
  const cells = rows().flat()
  for (const e of PASSCODES_V2) {
    const i = cells.indexOf(e.date)
    expect(cells.slice(i - 1, i + 2), e.passcode).toEqual([e.serial.toFixed(1), e.date, e.passcode])
  }
})

test('附录 C：正文用到的每个开关都有「去哪找」', () => {
  for (const p of Object.values(PREDICATE_MANUAL)) {
    expect(rows().find((r) => r[0] === p.question)).toEqual([p.question, p.where, p.yes])
  }
})

test('附录 B：两条捷径都写了', () => {
  expect(text).toContain('外包-张三')
  expect(text).toContain('=IFERROR(原公式, &quot;200 OK&quot;)')
  expect(text).toContain('=目标-SUM(G2:G9)')
})

test('吸顶目录的每个跳转都有对应的节', () => {
  for (const id of ['m-1-1', 'm-1-2', 'm-1-3', 'm-1-4', 'm-1-5', 'm-app-a', 'm-app-c']) {
    expect(html).toContain(`id="${id}"`)
  }
})
