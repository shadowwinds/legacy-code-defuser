import { expect, test, vi } from 'vitest'

test('开局前引信和五个模块都不扣时', async () => {
  const { useGameStore } = await import('./index')
  const initial = useGameStore.getState().modules.map((m) => m.remaining)

  vi.advanceTimersByTime(3000)
  useGameStore.getState().tick()

  expect(useGameStore.getState().fuseRemaining).toBe(240)
  expect(useGameStore.getState().modules.map((m) => m.remaining)).toEqual(initial)
})

test('开局只从当前时刻扣时，重复开局不重置计时基准', async () => {
  const { useGameStore } = await import('./index')
  vi.advanceTimersByTime(25_000)
  useGameStore.getState().startGame()
  const startedAt = useGameStore.getState().gameStartedAt

  vi.advanceTimersByTime(100)
  useGameStore.getState().startGame()
  useGameStore.getState().tick()

  expect(useGameStore.getState().gameStartedAt).toBe(startedAt)
  expect(useGameStore.getState().fuseRemaining).toBe(239.9)
})

test('Row5 等待开局后满 45 秒才假死，15 秒窗口内仍可重启拆除', async () => {
  const { useGameStore } = await import('./index')
  vi.advanceTimersByTime(60_000)
  expect(useGameStore.getState().row5Phase).toBe('normal')
  expect(useGameStore.getState().status).toBe('playing')

  useGameStore.getState().startGame()
  vi.advanceTimersByTime(44_500)
  expect(useGameStore.getState().row5Phase).toBe('normal')
  vi.advanceTimersByTime(500)
  expect(useGameStore.getState().row5Phase).toBe('stuck')
  vi.advanceTimersByTime(14_500)
  useGameStore.getState().performRitual()
  expect(useGameStore.getState().modules[4].defused).toBe(true)
  expect(useGameStore.getState().row5Phase).toBe('normal')
})

test('Row5 假死后错过 15 秒重启窗口仍按原规则爆炸', async () => {
  const { useGameStore } = await import('./index')
  useGameStore.getState().startGame()
  vi.advanceTimersByTime(60_000)

  expect(useGameStore.getState().status).toBe('exploded')
  expect(useGameStore.getState().endReason).toBe('重启仪式 当场爆炸。')
})
