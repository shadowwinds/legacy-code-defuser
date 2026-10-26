import { afterEach, beforeEach, vi } from 'vitest'

// 只替换浏览器和时间边界；store 与切片使用真实实现，每个用例重新创建一局。
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-26T00:00:00Z'))
  vi.resetModules()
  vi.stubGlobal('window', Object.assign(new EventTarget(), { setInterval, setTimeout, clearInterval, clearTimeout }))
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
