import { expect, test, vi } from 'vitest'

const withSearch = (search: string) => vi.stubGlobal('location', { search, pathname: '/lcd/', hash: '' })

const snapshot = async () => {
  const { useGameStore } = await import('../store')
  const s = useGameStore.getState()
  return { seed: s.seed, modules: s.modules.map((m) => m.initial), passcodeIndex: s.passcodeIndex }
}

test('同一种子两次开局，所有随机结果一致', async () => {
  withSearch('?seed=TEST01')
  const a = await snapshot()
  vi.resetModules()
  const b = await snapshot()

  expect(a.seed).toBe('TEST01')
  expect(b).toEqual(a)
})

test('不同种子开出不同的局', async () => {
  const results = new Set<string>()
  for (const seed of ['A1', 'B2', 'C3', 'D4', 'E5']) {
    vi.resetModules()
    withSearch(`?seed=${seed}`)
    results.add(JSON.stringify((await snapshot()).modules))
  }
  expect(results.size).toBe(5)
})

test('种子不区分大小写、两端空白忽略', async () => {
  const { parseRunConfig } = await import('./seed')
  expect(parseRunConfig('?seed=%20abc12%20').seed).toBe('ABC12')
})

test('没有种子或种子非法时生成一个新的合法种子', async () => {
  const { parseRunConfig, SEED_PATTERN } = await import('./seed')
  for (const search of ['', '?seed=', '?seed=有中文', `?seed=${'X'.repeat(40)}`]) {
    const { seed } = parseRunConfig(search)
    expect(seed).toMatch(SEED_PATTERN)
  }
})

test('v2 开关默认关闭，?v2=1 打开', async () => {
  const { parseRunConfig } = await import('./seed')
  expect(parseRunConfig('').v2).toBe(false)
  expect(parseRunConfig('?v2=1').v2).toBe(true)
  expect(parseRunConfig('?v2=0').v2).toBe(false)
})

test('各随机流互相独立：多取一个流的值不影响另一个流', async () => {
  const { streamFor } = await import('./seed')
  const a1 = streamFor('S', 'modules')
  const first = [a1.next(), a1.next(), a1.next()]

  const b = streamFor('S', 'passcode')
  b.next()
  b.next()
  const a2 = streamFor('S', 'modules')
  expect([a2.next(), a2.next(), a2.next()]).toEqual(first)
})

test('随机流输出落在 [0, 1)，int(n) 落在 [0, n)', async () => {
  const { streamFor } = await import('./seed')
  const r = streamFor('RANGE', 'x')
  for (let i = 0; i < 1000; i++) {
    const v = r.next()
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThan(1)
    const k = r.int(5)
    expect(Number.isInteger(k) && k >= 0 && k < 5).toBe(true)
  }
})

test('重开新局的链接去掉种子、保留其他参数', async () => {
  const { newRunSearch, replaySearch } = await import('./seed')
  expect(newRunSearch('?seed=ABC&v2=1&intro=1')).toBe('?v2=1&intro=1')
  expect(newRunSearch('?seed=ABC')).toBe('')
  expect(replaySearch('?v2=1', 'XYZ')).toBe('?v2=1&seed=XYZ')
})

test('Edge B 反噬目标由种子决定', async () => {
  withSearch('?seed=EDGEB')
  const { EDGE_B } = await import('./dependencyGraph')
  const picks1 = Array.from({ length: 8 }, () => EDGE_B.pickTarget!([1, 2, 3, 4]))
  vi.resetModules()
  withSearch('?seed=EDGEB')
  const { EDGE_B: again } = await import('./dependencyGraph')
  const picks2 = Array.from({ length: 8 }, () => again.pickTarget!([1, 2, 3, 4]))
  expect(picks2).toEqual(picks1)
})
