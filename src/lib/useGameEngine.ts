import { useEffect } from 'react'
import { useGameStore } from '../store'

const TICK_MS = 100

/**
 * 全局引擎驱动：App 挂载时启动一次 100ms tick（StrictMode 双挂载下 effect
 * 建/清对称，最终仅存在一个 interval）。组件一律禁止自开 interval，
 * 只通过 store selector 订阅所需切片。
 */
export function useGameEngine(): void {
  useEffect(() => {
    const id = window.setInterval(() => {
      useGameStore.getState().tick()
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [])
}
