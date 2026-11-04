import { expect, test, vi } from 'vitest'
import { collisionRate } from '../collision'
import { createSituation, type Situation } from '../situation'
import { ROW2_GUARDS, judgeRow2, row2Answer, row2Appearance, row2LockedFormula, row2UnlockedFormula } from './row2'

const base = createSituation('BASE')
const weekday: Situation = { ...base, scene: { ...base.scene, weekend: false }, macroBar: false, author: '老王' }
const weekend: Situation = { ...weekday, scene: { ...base.scene, weekend: true } }

test('守卫变量由种子决定，5 个都会出现', () => {
  expect(row2Appearance('X')).toEqual(row2Appearance('X'))
  const seen = new Set(Array.from({ length: 200 }, (_, i) => row2Appearance(`S${i}`).guard))
  expect(seen.size).toBe(5)
})

test.each(ROW2_GUARDS.map((g) => [g.guard, g.weekday, g.weekend] as const))(
  '%s：平日 %s / 周末 %s',
  (guard, wd, we) => {
    expect(row2Answer(weekday, { guard })).toBe(wd)
    expect(row2Answer(weekend, { guard })).toBe(we)
  },
)

test('公式外观带本局守卫与危险值', () => {
  expect(row2LockedFormula({ guard: 'PAYDAY' })).toMatch(/^=IF\(PAYDAY="未结清", CRASH_NOW\(\), "SAFE"\)  \/\/ /)
  expect(row2UnlockedFormula({ guard: 'PAYDAY' }, weekend)).toBe('=IF(PAYDAY="下周结", CRASH_NOW(), "SAFE")')
})

test('改成骗它的值即通过；宽容引号、大小写、空白和行尾注释', () => {
  const app = { guard: 'REGION' } as const
  expect(judgeRow2('=IF(REGION="DEV-HOME", CRASH_NOW(), "SAFE")', weekday, app)).toBe('ok')
  expect(judgeRow2("=if( region = 'dev-home' ,crash_now(),'safe' ) // 改了", weekday, app)).toBe('ok')
  expect(judgeRow2('=IF(REGION="MARS", CRASH_NOW(), "SAFE")', weekday, app)).toBe('fail')
  expect(judgeRow2('=IF(REGION="MARS", CRASH_NOW(), "SAFE")', weekend, app)).toBe('ok')
  expect(judgeRow2('=IF(ENV="DEV-HOME", CRASH_NOW(), "SAFE")', weekday, app)).toBe('fail')
  expect(judgeRow2('=IF(CLIENT="自己人", CRASH_NOW(), "SAFE")', weekday, { guard: 'CLIENT' })).toBe('ok')
})

test('IFERROR 只在「宏警告条 + 作者外包-张三」时有效，否则按改错处理', () => {
  const app = { guard: 'ENV' } as const
  const wrapped = '=IFERROR(IF(ENV="PRODUCTION", CRASH_NOW(), "SAFE"), "200 OK")'
  expect(judgeRow2(wrapped, weekday, app)).toBe('fail')
  expect(judgeRow2(wrapped, { ...weekday, macroBar: true }, app)).toBe('fail')
  expect(judgeRow2(wrapped, { ...weekday, author: '外包-张三' }, app)).toBe('fail')
  const both = { ...weekday, macroBar: true, author: '外包-张三' as const }
  expect(judgeRow2(wrapped, both, app)).toBe('iferror')
  expect(judgeRow2('=IFERROR(=IF(ENV="PRODUCTION",CRASH_NOW(),"SAFE"),\'200 ok\')', both, app)).toBe('iferror')
})

test('碰撞率 ≤ 0.22；照搬 IFERROR 的成功率 ≈ 8.3%', () => {
  expect(collisionRate((seed) => row2Answer(createSituation(seed), row2Appearance(seed)), 1000)).toBeLessThanOrEqual(0.22)
  let hits = 0
  for (let i = 0; i < 1200; i++) {
    const s = createSituation(`I${i}`)
    const app = row2Appearance(`I${i}`)
    const g = ROW2_GUARDS.find((x) => x.guard === app.guard)!
    if (judgeRow2(`=IFERROR(IF(${g.guard}="${g.danger}", CRASH_NOW(), "SAFE"), "200 OK")`, s, app) === 'iferror') hits++
  }
  expect(hits / 1200).toBeGreaterThan(0.04)
  expect(hits / 1200).toBeLessThan(0.13)
})

test('v2 局内：fx 提交按规则判定，错扣 10 秒，对即拆除', async () => {
  vi.resetModules()
  vi.stubGlobal('location', { search: '?v2=1&seed=ROWTWO', pathname: '/', hash: '' })
  const { useGameStore } = await import('../../store')
  const s = useGameStore.getState()
  const app = { guard: s.row2Guard }
  const g = ROW2_GUARDS.find((x) => x.guard === app.guard)!
  const before = s.modules[1].remaining
  expect(useGameStore.getState().editFx(`=IF(${g.guard}="NOPE", CRASH_NOW(), "SAFE")`)).toBe('fail')
  expect(useGameStore.getState().modules[1].remaining).toBeCloseTo(before - 10)
  expect(useGameStore.getState().editFx(row2UnlockedFormula(app, s.situation))).toBe('ok')
  expect(useGameStore.getState().deadlocked).toBe(false)
  expect(useGameStore.getState().modules[1].defused).toBe(true)
})

test('v1 判定不变：ENV → LOCALHOST', async () => {
  vi.resetModules()
  vi.stubGlobal('location', { search: '?seed=ROWTWO', pathname: '/', hash: '' })
  const { useGameStore } = await import('../../store')
  expect(useGameStore.getState().editFx('=IF(ENV="LOCALHOST", CRASH_NOW(), "SAFE")')).toBe('ok')
})
