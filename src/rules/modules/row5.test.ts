import { afterEach, expect, test, vi } from 'vitest'
import { collisionRate } from '../collision'
import { createSituation, type Situation } from '../situation'
import { ROW5_CODES, row5Answer, row5Appearance, type Row5Ritual } from './row5'

const base = createSituation('BASE')
const sit = (patch: Partial<Situation>): Situation => ({ ...base, ...patch })

afterEach(() => {
  vi.useRealTimers()
})

test('外观由种子决定：5 个报错码都会出现，首次假死 35–55 秒', () => {
  expect(row5Appearance('X')).toEqual(row5Appearance('X'))
  const all = Array.from({ length: 300 }, (_, i) => row5Appearance(`S${i}`))
  expect(new Set(all.map((a) => a.code)).size).toBe(ROW5_CODES.length)
  const ms = all.map((a) => a.firstStuckMs)
  expect(Math.min(...ms)).toBe(35_000)
  expect(Math.max(...ms)).toBe(55_000)
})

test.each([
  ['#STUCK!', { scene: { ...base.scene, weekend: false } }, 'restart'],
  ['#STUCK!', { scene: { ...base.scene, weekend: true } }, 'incense'],
  ['#TIMEOUT!', { macroBar: false }, 'unplug'],
  ['#TIMEOUT!', { macroBar: true }, 'clear-cache'],
  ['#OOM!', { version: 8 }, 'clear-cache'],
  ['#OOM!', { version: 9 }, 'rollback'],
  ['#EPIPE!', { scene: { ...base.scene, night: false } }, 'unplug'],
  ['#EPIPE!', { scene: { ...base.scene, night: true } }, 'incense'],
  ['#HANG!', { date: { ...base.date, day: 15 } }, 'rollback'],
  ['#HANG!', { date: { ...base.date, day: 16 } }, 'restart'],
] as const)('%s 在 %o 时仪式是 %s', (code, patch, ritual) => {
  expect(row5Answer(sit(patch as Partial<Situation>), { code })).toBe(ritual)
})

test('碰撞率 ≤ 0.22（理论 20%）', () => {
  expect(collisionRate((seed) => row5Answer(createSituation(seed), row5Appearance(seed)), 1000)).toBeLessThanOrEqual(0.22)
})

test('v2 局内：首次假死按本局时刻；选错 -10s 可重试，选对拆除', async () => {
  vi.useFakeTimers()
  vi.resetModules()
  vi.stubGlobal('location', { search: '?v2=1&seed=ROWFIVE', pathname: '/', hash: '' })
  const { useGameStore } = await import('../../store')
  const { firstStuckMs } = row5Appearance('ROWFIVE')
  useGameStore.getState().startGame()

  vi.advanceTimersByTime(firstStuckMs - 1000)
  expect(useGameStore.getState().row5Phase).toBe('normal')
  vi.advanceTimersByTime(1500)
  expect(useGameStore.getState().row5Phase).toBe('stuck')

  const s = useGameStore.getState()
  const answer = row5Answer(s.situation, { code: s.row5Code })
  const wrong = (['restart', 'unplug', 'clear-cache', 'rollback', 'incense'] as Row5Ritual[]).find((r) => r !== answer)!
  const before = useGameStore.getState().modules[4].remaining
  expect(useGameStore.getState().performRitual(wrong)).toBe('wrong')
  expect(useGameStore.getState().modules[4].remaining).toBeCloseTo(before - 10, 0)
  expect(useGameStore.getState().row5Phase).toBe('stuck')

  expect(useGameStore.getState().performRitual(answer)).toBe('correct')
  expect(useGameStore.getState().modules[4].defused).toBe(true)
})

test('v1：45 秒首次假死，[重启服务] 即成功', async () => {
  vi.useFakeTimers()
  vi.resetModules()
  vi.stubGlobal('location', { search: '?seed=ROWFIVE', pathname: '/', hash: '' })
  const { useGameStore } = await import('../../store')
  useGameStore.getState().startGame()
  vi.advanceTimersByTime(44_000)
  expect(useGameStore.getState().row5Phase).toBe('normal')
  vi.advanceTimersByTime(1_500)
  expect(useGameStore.getState().row5Phase).toBe('stuck')
  expect(useGameStore.getState().performRitual('restart')).toBe('correct')
})
