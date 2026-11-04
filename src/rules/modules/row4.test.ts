import { expect, test, vi } from 'vitest'
import { collisionRate } from '../collision'
import { SCENES, createSituation } from '../situation'
import { row4Answer, row4Appearance, row4Stat, row4Target } from './row4'

const base = createSituation('BASE')
const at = (id: string) => ({ ...base, scene: SCENES.find((s) => s.id === id)! })

test('目标值按时间场景：平日白天 1024 / 平日深夜 2048 / 周末白天 996 / 周末深夜 404', () => {
  expect(row4Target(at('fri-close'))).toBe(1024)
  expect(row4Target(at('wed-release'))).toBe(2048)
  expect(row4Target(at('sat-review'))).toBe(996)
  expect(row4Target(at('sun-eve'))).toBe(404)
})

test('外观由种子决定：两种统计方式都会出现，G 列结构同 v1', () => {
  expect(row4Appearance('X')).toEqual(row4Appearance('X'))
  const modes = new Set(Array.from({ length: 50 }, (_, i) => row4Appearance(`S${i}`).mode))
  expect(modes).toEqual(new Set(['sum', 'avg']))
  const { junk } = row4Appearance('X')
  expect(junk).toHaveLength(8)
  expect(junk[3]).toBe('#DIV/0!')
  expect([junk[1], junk[5], junk[6]]).toEqual([null, null, null])
})

test('统计：错误格算不出；平均值不计空格', () => {
  expect(row4Stat([1, '#DIV/0!'], 'sum')).toBeNull()
  expect(row4Stat([1, null, 3], 'sum')).toBe(4)
  expect(row4Stat([1, null, 3], 'avg')).toBe(2)
  expect(row4Stat([null, null], 'avg')).toBeNull()
})

test('碰撞率 ≤ 0.22（理论 12.5%）', () => {
  expect(collisionRate((seed) => row4Answer(createSituation(seed), row4Appearance(seed)), 1000)).toBeLessThanOrEqual(0.22)
})

async function v2Store(seed: string) {
  vi.resetModules()
  vi.stubGlobal('location', { search: `?v2=1&seed=${seed}`, pathname: '/', hash: '' })
  return (await import('../../store')).useGameStore
}
const label = async (store: Awaited<ReturnType<typeof v2Store>>) =>
  (await import('../../store/row4Slice')).reconSumLabel(store.getState())

/** 找一个指定统计方式的种子 */
const seedWith = (mode: 'sum' | 'avg') => {
  for (let i = 0; ; i++) if (row4Appearance(`R4${i}`).mode === mode) return `R4${i}`
}

test('v2 求和模式：凑到本局目标即拆；偷懒公式用本局目标有效', async () => {
  const seed = seedWith('sum')
  let store = await v2Store(seed)
  const target = store.getState().row4Target
  expect(target).toBe(row4Target(createSituation(seed)))
  const g8 = store.getState().gCells[7] as number
  store.getState().setGCell(3, '')
  store.getState().setGCell(0, '')
  store.getState().setGCell(2, '')
  store.getState().setGCell(4, String(target - g8))
  expect(store.getState().gBalanced).toBe(true)
  expect(await label(store)).toBe(`求和: ${target}`)

  store = await v2Store(seed)
  store.getState().setGCell(1, `=${target}-SUM(G2:G9)`)
  expect(store.getState().gBalanced).toBe(true)
})

test('v2 平均值模式：让平均值等于目标才拆；偷懒公式无效', async () => {
  const seed = seedWith('avg')
  const store = await v2Store(seed)
  const target = store.getState().row4Target
  expect(await label(store)).toBe('平均值: #DIV/0!')
  store.getState().setGCell(1, `=${target}-SUM(G2:G9)`)
  expect(store.getState().gBalanced).toBe(false)
  store.getState().setGCell(1, '')
  store.getState().setGCell(3, '')
  // 只留 G1 与 G8：(x + g8) / 2 = target
  const g8 = store.getState().gCells[7] as number
  store.getState().setGCell(2, '')
  store.getState().setGCell(4, '')
  store.getState().setGCell(0, String(2 * target - g8))
  expect(store.getState().gBalanced).toBe(true)
  expect(store.getState().modules[3].defused).toBe(true)
})

test('v1：求和 1024，状态栏文案不变', async () => {
  vi.resetModules()
  vi.stubGlobal('location', { search: '?seed=R4V1', pathname: '/', hash: '' })
  const { useGameStore } = await import('../../store')
  const { reconSumLabel } = await import('../../store/row4Slice')
  expect(reconSumLabel(useGameStore.getState())).toBe('求和: ≠1024')
  useGameStore.getState().setGCell(3, '=1024-SUM(G2:G9)')
  expect(useGameStore.getState().gBalanced).toBe(true)
})
