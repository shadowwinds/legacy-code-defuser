import { expect, test } from 'vitest'
import raw from '../../docs/desktop/dialogues.json'
import { formatFuseClock } from '../lib/clock'
import { WEEKDAY_NAMES, resolveDialogueText, sceneCopy } from './sceneCopy'
import { SCENES, createSituation, type SceneId, type Situation } from './situation'

type RawMessage = { id: string; text: string; sceneText?: Partial<Record<SceneId, string>> }
const messages = (raw as { messages: RawMessage[] }).messages
const textOf = (id: string, situation: Situation | null) => {
  const m = messages.find((x) => x.id === id)!
  return resolveDialogueText(m.text, m.sceneText, sceneCopy(situation))
}

const base = createSituation('BASE')
const at = (id: SceneId, date = { year: 2026, month: 11, day: 4 }): Situation => ({
  ...base,
  scene: SCENES.find((s) => s.id === id)!,
  date,
})

test('v1（无局面）：文案与改造前逐字一致', () => {
  expect(textOf('sb_01', null)).toBe('2026-10-24 周五 16:53 · 你的工位')
  expect(textOf('sb_10', null)).toBe('双击 Excel,打开「核心业务_最终版_打死勿动.xlsx」')
  expect(textOf('ed_fuse_01', null)).toBe('【系统提示】17:00 已到,全表爆炸。')
  expect(textOf('ed_win_03', null)).toBe('下班打卡打了嘛?今天可是周五哦~周末愉快!')
  expect(textOf('ed_row4_01', null)).toBe('差 1024?!这是钱的事吗?这是态度的事!')
  expect(textOf('egg_taskbar_xl', null)).toMatch(/^核心业务_最终版_打死勿动\.xlsx —— /)
  const v1 = sceneCopy(null)
  expect([v1.winReason, v1.fuseReason, v1.dateLabel]).toEqual(['17:00 准点跑路，下班！', '17:00 了，引信烧完，全表爆炸。', '2026/10/24 周五'])
})

test('v1 时钟：16:56:00 → 17:00:00', () => {
  expect(formatFuseClock(240)).toBe('16:56:00')
  expect(formatFuseClock(0)).toBe('17:00:00')
})

test.each([
  ['fri-close', '16:56:00', '17:00:00', '17:00', '16:53'],
  ['wed-release', '21:56:00', '22:00:00', '22:00', '21:53'],
  ['sat-review', '09:56:00', '10:00:00', '10:00', '09:53'],
  ['sun-eve', '23:56:00', '00:00:00', '00:00', '23:53'],
] as const)('%s：时钟 %s → %s，截止 %s，开场 %s', (id, start, end, deadline, intro) => {
  const copy = sceneCopy(at(id))
  expect(formatFuseClock(240, copy.deadlineHour)).toBe(start)
  expect(formatFuseClock(0, copy.deadlineHour)).toBe(end)
  expect(copy.vars.deadline).toBe(deadline)
  expect(copy.vars.introTime).toBe(intro)
  expect(copy.fuseReason.startsWith(deadline)).toBe(true)
  expect(copy.winReason.startsWith(deadline)).toBe(true)
})

test('v2 日期与星期来自局面', () => {
  const s = createSituation('K7Q2ZP')
  const copy = sceneCopy(s)
  const wd = new Date(Date.UTC(s.date.year, s.date.month - 1, s.date.day)).getUTCDay()
  expect(copy.dateLabel).toBe(`${s.date.year}/${s.date.month}/${s.date.day} ${WEEKDAY_NAMES[wd]}`)
  expect(wd).toBe(s.scene.weekday)
  expect(textOf('sb_01', s)).toContain(copy.vars.date)
  expect(textOf('sb_10', s)).toContain(`核心业务_最终版_v${s.version}.xlsx`)
})

test('v2 每个场景：全部文案无残留占位符、不出现别的场景的时间，结局 win_03 按场景改写', () => {
  for (const scene of SCENES) {
    const s = at(scene.id)
    for (const m of messages) {
      const t = resolveDialogueText(m.text, m.sceneText, sceneCopy(s))
      expect(t, m.id).not.toMatch(/\{\w+\}/)
      if (scene.id !== 'fri-close') {
        expect(t, m.id).not.toContain('17:00')
        expect(t, m.id).not.toContain('周五')
      }
    }
  }
  const wins = SCENES.map((sc) => textOf('ed_win_03', at(sc.id)))
  expect(new Set(wins).size).toBe(4)
})

test('v2 Row4 结局文案用本局目标值', () => {
  expect(textOf('ed_row4_01', at('sun-eve'))).toBe('差 404?!这是钱的事吗?这是态度的事!')
})
