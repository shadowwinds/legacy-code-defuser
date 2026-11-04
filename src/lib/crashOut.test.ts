import { expect, test } from 'vitest'
import { LEAK_ZONES, climaxProgress, leakSpots } from './crashOut'

const mods = (...rem: number[]) => rem.map((remaining) => ({ remaining, defused: false }))

test('最后 30 秒之前不漏：引信 > 30 且所有未拆模块 > 10', () => {
  expect(climaxProgress({ status: 'playing', fuseRemaining: 31, modules: mods(11, 50) })).toBe(0)
})

test('引信 ≤ 30 或任一未拆模块 ≤ 10 即进入，进入后至少 0.1，归零时到 1', () => {
  expect(climaxProgress({ status: 'playing', fuseRemaining: 30, modules: mods(50) })).toBeCloseTo(0.1)
  expect(climaxProgress({ status: 'playing', fuseRemaining: 200, modules: mods(10, 50) })).toBeCloseTo(0.1)
  expect(climaxProgress({ status: 'playing', fuseRemaining: 200, modules: mods(5) })).toBeCloseTo(0.55)
  expect(climaxProgress({ status: 'playing', fuseRemaining: 0, modules: mods(50) })).toBe(1)
})

test('已拆模块不算；终局后不漏', () => {
  expect(climaxProgress({ status: 'playing', fuseRemaining: 200, modules: [{ remaining: 2, defused: true }, ...mods(60)] })).toBe(0)
  expect(climaxProgress({ status: 'exploded', fuseRemaining: 0, modules: mods(0) })).toBe(0)
})

test('漏出按区域先后：Ribbon → 窗口边框 → 状态栏 → 任务栏', () => {
  const zonesAt = (p: number) => new Set(leakSpots(p, 'S').map((s) => s.zone))
  expect(leakSpots(0, 'S')).toEqual([])
  expect([...zonesAt(0.1)]).toEqual(['ribbon'])
  expect([...zonesAt(0.5)]).toEqual(['ribbon', 'chrome'])
  expect([...zonesAt(0.7)]).toEqual(['ribbon', 'chrome', 'statusbar'])
  expect([...zonesAt(1)]).toEqual([...LEAK_ZONES])
})

test('进度上升只增不挪；同种子同画面', () => {
  const key = (s: { zone: string; index: number; fx: number; fy: number; text: string }) => JSON.stringify(s)
  let prev = new Set<string>()
  for (let p = 0.05; p <= 1; p += 0.05) {
    const cur = new Set(leakSpots(p, 'MONO').map(key))
    for (const k of prev) expect(cur.has(k)).toBe(true)
    prev = cur
  }
  expect(leakSpots(0.8, 'X')).toEqual(leakSpots(0.8, 'X'))
  expect(leakSpots(0.8, 'X')).not.toEqual(leakSpots(0.8, 'Y'))
})

test('相对位置都在区域内', () => {
  for (const s of leakSpots(1, 'BOUNDS')) {
    expect(s.fx).toBeGreaterThanOrEqual(0)
    expect(s.fx).toBeLessThan(1)
    expect(s.fy).toBeGreaterThanOrEqual(0)
    expect(s.fy).toBeLessThan(1)
  }
})

test('终局顺延：v2 爆炸等碎窗、通关等倒放；v1 不顺延', async () => {
  const { endingDelayMs, SHATTER_MS, REWIND_MS } = await import('./crashOut')
  expect(endingDelayMs('exploded', true)).toBe(SHATTER_MS)
  expect(endingDelayMs('won', true)).toBe(REWIND_MS)
  expect(endingDelayMs('exploded', false)).toBe(0)
  expect(endingDelayMs('won', false)).toBe(0)
})

test('碎窗：块数 = 列 × 行，顶点都在窗口内，相邻块共用格点（无缝）', async () => {
  const { shardPlan } = await import('./crashOut')
  const shards = shardPlan('SHARD', 4, 3)
  expect(shards).toHaveLength(12)
  for (const s of shards) for (const [x, y] of s.points) {
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThanOrEqual(100)
    expect(y).toBeGreaterThanOrEqual(0)
    expect(y).toBeLessThanOrEqual(100)
  }
  // 第 0 块的右上角 = 第 1 块的左上角
  expect(shards[0].points[1]).toEqual(shards[1].points[0])
  // 第 0 块的左下角 = 下一行第 0 块的左上角
  expect(shards[0].points[3]).toEqual(shards[4].points[0])
  expect(shardPlan('SHARD')).toEqual(shardPlan('SHARD'))
})
