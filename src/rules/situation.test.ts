import { expect, test } from 'vitest'
import { AUTHORS, SCENES, createSituation, predicates } from './situation'
import { collisionRate } from './collision'

const seeds = Array.from({ length: 2000 }, (_, i) => `S${i}`)

test('同一种子生成同一局面', () => {
  expect(createSituation('ABC123')).toEqual(createSituation('ABC123'))
})

test('版本号 2–29、日期 1–28 号、作者在名单内', () => {
  for (const seed of seeds.slice(0, 300)) {
    const s = createSituation(seed)
    expect(s.version).toBeGreaterThanOrEqual(2)
    expect(s.version).toBeLessThanOrEqual(29)
    expect(s.date.day).toBeGreaterThanOrEqual(1)
    expect(s.date.day).toBeLessThanOrEqual(28)
    expect(AUTHORS).toContain(s.author)
  }
})

test('日期和场景的星期在日历上一致', () => {
  for (const seed of seeds.slice(0, 300)) {
    const s = createSituation(seed)
    const weekday = new Date(Date.UTC(s.date.year, s.date.month - 1, s.date.day)).getUTCDay()
    expect(weekday).toBe(s.scene.weekday)
  }
})

test('四个场景正好铺满 周末 × 深夜 两个开关', () => {
  const combos = new Set(SCENES.map((sc) => `${sc.weekend}-${sc.night}`))
  expect(combos.size).toBe(4)
})

test('每个二值谓词的真假比例都接近一半', () => {
  const all = seeds.map(createSituation)
  for (const name of ['versionOdd', 'macroBar', 'weekend', 'night', 'pastPayday'] as const) {
    const ratio = all.filter(predicates[name]).length / all.length
    expect(ratio, name).toBeGreaterThan(0.42)
    expect(ratio, name).toBeLessThan(0.58)
  }
})

test('外壳变量之间互不牵连：周末与版本号单双独立', () => {
  const all = seeds.map(createSituation)
  const weekend = all.filter(predicates.weekend)
  const ratio = weekend.filter(predicates.versionOdd).length / weekend.length
  expect(ratio).toBeGreaterThan(0.42)
  expect(ratio).toBeLessThan(0.58)
})

test('碰撞率工具：按种子算相邻两局答案相同的比例', () => {
  expect(collisionRate(() => 'same', 100)).toBe(1)
  const byScene = collisionRate((seed) => createSituation(seed).scene.id, 2000)
  expect(byScene).toBeGreaterThan(0.2)
  expect(byScene).toBeLessThan(0.3)
})
