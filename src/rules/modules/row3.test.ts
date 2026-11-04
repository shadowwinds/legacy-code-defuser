import { expect, test, vi } from 'vitest'
import { collisionRate } from '../collision'
import { createSituation } from '../situation'
import { PASSCODES_V2, row3Answer, row3Appearance, row3Cell } from './row3'

const base = createSituation('BASE')

test('附录 A 12 行，序列值与日期严格对应', () => {
  expect(PASSCODES_V2).toHaveLength(12)
  for (const e of PASSCODES_V2) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(e.serial) * 86400000)
    expect(d.toISOString().slice(0, 10)).toBe(e.date)
  }
  expect(new Set(PASSCODES_V2.map((e) => e.passcode)).size).toBe(12)
})

test('外观由种子决定，12 行都会抽到', () => {
  expect(row3Appearance('X')).toEqual(row3Appearance('X'))
  expect(new Set(Array.from({ length: 400 }, (_, i) => row3Appearance(`S${i}`).index)).size).toBe(12)
})

test('版本号单数填 F3，双数填 H3', () => {
  expect(row3Cell({ ...base, version: 7 })).toBe('F3')
  expect(row3Cell({ ...base, version: 12 })).toBe('H3')
})

test('碰撞率 ≤ 0.08（理论 4.2%，验收线 0.22）', () => {
  expect(collisionRate((seed) => row3Answer(createSituation(seed), row3Appearance(seed)), 1000)).toBeLessThanOrEqual(0.08)
})

test('v2 局内：口令对但格子错 → 按填错处理；格子对 → 拆除', async () => {
  vi.resetModules()
  vi.stubGlobal('location', { search: '?v2=1&seed=ROWTHREE', pathname: '/', hash: '' })
  const { useGameStore } = await import('../../store')
  const s = useGameStore.getState()
  const { passcode, cell } = row3Answer(s.situation, { index: s.passcodeIndex })
  const other = cell === 'F3' ? 'H3' : 'F3'
  expect(useGameStore.getState().submitPasscode(passcode, other)).toBe('wrong')
  expect(useGameStore.getState().wrongLock).toBe(true)
  expect(useGameStore.getState().submitPasscode(passcode, cell)).toBe('correct')
  expect(useGameStore.getState().modules[2].defused).toBe(true)
})

test('v1：只有 F3、5 行口令表不变', async () => {
  vi.resetModules()
  vi.stubGlobal('location', { search: '?seed=ROWTHREE', pathname: '/', hash: '' })
  const { useGameStore } = await import('../../store')
  const { PASSCODES } = await import('../../data/passcodes')
  const s = useGameStore.getState()
  expect(s.passcodeIndex).toBeLessThan(5)
  expect(useGameStore.getState().submitPasscode(PASSCODES[s.passcodeIndex].passcode)).toBe('correct')
})
