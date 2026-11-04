import { expect, test, vi } from 'vitest'
import { collisionRate } from '../collision'
import { createSituation, type Situation } from '../situation'
import { ROW1_CODES, row1Answer, row1Appearance } from './row1'

const base = createSituation('BASE')
const sit = (patch: Partial<Situation>): Situation => ({ ...base, ...patch })

test('报错码由种子决定，且在 5 个之内', () => {
  expect(row1Appearance('X1')).toEqual(row1Appearance('X1'))
  const seen = new Set(Array.from({ length: 200 }, (_, i) => row1Appearance(`S${i}`).code))
  expect([...seen].sort()).toEqual([...ROW1_CODES].sort())
})

test.each([
  ['#结构损坏!', { macroBar: false }, 'split-fill'],
  ['#结构损坏!', { macroBar: true }, 'split-nofill'],
  ['#合并冲突!', { version: 4 }, 'force-write'],
  ['#合并冲突!', { version: 7 }, 'split-fill'],
  ['#引用断裂!', { date: { year: 2026, month: 1, day: 3 } }, 'split-nofill'],
  ['#引用断裂!', { date: { year: 2026, month: 1, day: 20 } }, 'center-across'],
] as const)('%s 在 %o 时答案是 %s', (code, patch, answer) => {
  expect(row1Answer(sit(patch as Partial<Situation>), { code })).toBe(answer)
})

test('周末 / 深夜开关读时间场景', () => {
  const weekend = createSituation('BASE')
  const scene = { ...weekend.scene, weekend: true, night: false }
  expect(row1Answer(sit({ scene }), { code: '#排序失败!' })).toBe('to-table')
  expect(row1Answer(sit({ scene: { ...scene, weekend: false } }), { code: '#排序失败!' })).toBe('center-across')
  expect(row1Answer(sit({ scene: { ...scene, night: true } }), { code: '#筛选失效!' })).toBe('force-write')
})

test('碰撞率 ≤ 0.22', () => {
  const rate = collisionRate((seed) => row1Answer(createSituation(seed), row1Appearance(seed)), 1000)
  expect(rate).toBeLessThanOrEqual(0.22)
})

test('v2 局内：按规则表选对即拆除，选错扣本行 20 秒', async () => {
  vi.resetModules()
  vi.stubGlobal('location', { search: '?v2=1&seed=ROWONE', pathname: '/', hash: '' })
  const { useGameStore } = await import('../../store')
  const s = useGameStore.getState()
  const answer = row1Answer(s.situation, { code: s.row1Code })
  const wrong = (['split-fill', 'split-nofill', 'force-write', 'center-across', 'to-table'] as const).find((o) => o !== answer)!

  const before = s.modules[0].remaining
  expect(useGameStore.getState().chooseOption(wrong)).toBe('wrong')
  expect(useGameStore.getState().modules[0].remaining).toBeCloseTo(before - 20)

  expect(useGameStore.getState().chooseOption(answer)).toBe('correct')
  expect(useGameStore.getState().modules[0].defused).toBe(true)
})

test('v1（无 v2 开关）仍按「网关是否已拆」判定', async () => {
  vi.resetModules()
  vi.stubGlobal('location', { search: '?seed=ROWONE', pathname: '/', hash: '' })
  const { useGameStore } = await import('../../store')
  const { getRunConfig } = await import('../../lib/seed')
  expect(getRunConfig().v2).toBe(false)
  // 网关未拆 → 强行写入是错的，拆分并填充才对
  expect(useGameStore.getState().chooseOption('force-write')).toBe('wrong')
  expect(useGameStore.getState().chooseOption('split-fill')).toBe('correct')
})
